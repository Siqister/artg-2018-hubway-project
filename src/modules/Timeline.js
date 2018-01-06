import {select, histogram, scaleLinear, scaleTime, min, max, timeHour, timeDay, timeWeek, line, area, axisBottom, axisLeft} from 'd3';
import {loadingStatusSm} from './LoadingStatus';

export default function Timeline(_){

	//Internal variables and state
	let _w = 500, _h = 300; //default width and height
	let _margin = {t:10,r:10,b:40,l:10};
	let _value = d => d; //accessor function
	let _domain = [new Date(2013,0,1), new Date(2018,0,1)]; //[x0, x1]
	let _range; //[y0, y1]
	let _interval = timeWeek; 
	let _ticks = 3;
	let _thresholds = _interval.range(_domain[0],_domain[1],1); //function or array

	const _histogram = histogram()
		.value(_value)
		.domain(_domain);
	const _scaleX = scaleTime();
	const _scaleY = scaleLinear();

	function exports(data){

		const svg = select(_||this);

		//Update state
		const w = _w - _margin.l - _margin.r;
		const h = _h - _margin.t - _margin.b;
		_thresholds = _interval.range(..._domain,1);
		_histogram
			.value(_value)
			.domain(_domain)
			.thresholds(_thresholds);
		const bins = _histogram(data);
		_scaleX.domain(_domain)
			.range([0,w]);
		_scaleY.domain(_range || [0, max(bins, d => d.length)])
			.range([h,0]);

		const timelineData = _histogram(data);

		//Generators
		const lineGenerator = line()
			.x(d => _scaleX(d.x0))
			.y(d => _scaleY(d.length));
		const areaGenerator = area()
			.x(d => _scaleX(d.x0))
			.y0(h)
			.y1(d => _scaleY(d.length));
		const axisXGenerator = axisBottom()
			.scale(_scaleX)
			.ticks(_interval.every(12));
		const axisYGenerator = axisLeft()
			.tickSize(-w)
			.scale(_scaleY)
			.ticks(_ticks);

		//Generate DOM
		let rootDom = svg
			.selectAll('.timeline')
			.data([data]);
		rootDom.exit().remove();
		rootDom = rootDom.enter().append('g')
			.call(selection => {
				if(selection.size()>0) svg.selectAll('.viz-module').remove(); //clear any existing .viz-module that is not .timeline
			})
			.merge(rootDom)
			.attr('transform',`translate(${_margin.l}, ${_margin.t})`)
			.attr('class','timeline viz-module');

		const lineComponent = rootDom
			.selectAll('.line')
			.data([timelineData]);
		lineComponent.enter().append('path')
			.attr('class','line')
			.merge(lineComponent)
			.transition()
			.duration(1000)
			.attr('d',lineGenerator)
			.style('fill','none');
		const areaComponent = rootDom
			.selectAll('.area')
			.data([timelineData]);
		areaComponent.enter().append('path')
			.attr('class','area')
			.merge(areaComponent)
			.transition()
			.duration(1000)
			.attr('d',areaGenerator);
		const axisYComponent = rootDom
			.selectAll('.axis-y')
			.data([1]);
		axisYComponent
			.enter()
			.append('g')
			.attr('class','axis axis-y')
			.merge(axisYComponent)
			.transition()
			.duration(1000)
			.call(axisYGenerator);

	}

	exports.width = function(_){
		if(typeof(_)==='undefined') return _w;
		_w = _;
		return this;
	}

	exports.height = function(_){
		if(typeof(_)==='undefined') return _h;
		_h = _;
		return this;
	}

	exports.margin = function(_){
		if(typeof(_)==='undefined') return _margin;
		_margin = Object.assign({}, _margin, _);
		return this;
	}

	exports.value = function(fn){
		if(typeof(fn)==='undefined') return _value;
		_value = fn;
		return this;
	}

	exports.domain = function(_){
		if(typeof(_)==='undefined') return _domain;
		_thresholds = _interval.range(_domain[0],_domain[1],1);
		_domain = _;
		return this;
	}

	exports.range = function(_){
		if(typeof(_)==='undefined') return _range;
		_range = _;
		return this;
	}

	exports.ticks = function(_){
		if(typeof(_)==='undefined') return _ticks;
		_ticks = _;
		return this;
	}

	exports.interval = function(_){
		if(typeof(_)==='undefined') return _interval;
		switch(_){
			case 'hour':
				_interval = timeHour;
			case 'day':
				_interval = timeDay;
			case 'week':
				_interval = timeWeek;
		}
		_thresholds = _interval.range(_domain[0],_domain[1],1);
		return this;
	}

	return exports;

}

function TimelineContainer(dom){

	let _svg;
	let _timeline;

	//Add loading indicator on module initialization
	select(dom)
		.append('div')
		.attr('class','loading-status')
		.each(loadingStatusSm);

	function exports(data){

		//On successful data injection, remove loading status
		select(dom)
			.select('.loading-status')
			.remove();

		//Recompute dom attributes
		const width = dom.clientWidth;
		const height = dom.clientHeight-30;

		//Data discovery
		const t0 = min(data, d => d.t0);
		const t1 = max(data, d => d.t1);

		if(!_svg){
			_svg = select(dom)
				.style('position','relative')
				.append('svg')
				.style('position','absolute')
				.style('bottom',0)
				.attr('width',width)
				.attr('height',height);

			_timeline = Timeline(_svg.append('g').node())
				.width(width)
				.height(height)
				.value(d => d.t0)
				.domain([t0,t1])
				.call(null,data);

			const anno = select(dom)
				.append('div')
				.style('padding','10px 10px 0')
				.attr('class','anno');
			anno.append('label')
				.html('Trip Activity');
		}else{
			_svg
				.attr('width',width)
				.attr('height',height);

			_timeline
				.width(width)
				.height(height)
				.domain([t0,t1])
				.call(null,data);
		}

	}

	return exports;

}

export const timelineMain = TimelineContainer(document.getElementById('timeline-main'));