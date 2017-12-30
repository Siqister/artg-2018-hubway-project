import {select, histogram, scaleLinear, scaleTime, max, timeHour, timeDay, timeWeek, line, area, axisBottom, axisLeft} from 'd3';

export default function Timeline(_){

	//Internal variables and state
	let _w = 500, _h = 300; //default width and height
	let _margin = {t:10,r:10,b:40,l:10};
	let _value = d => d; //accessor function
	let _domain = [new Date(2013,0,1), new Date(2018,0,1)]; //[x0, x1]
	let _range; //[y0, y1]
	let _interval = timeWeek; 
	let _thresholds = _interval.range(_domain[0],_domain[1],1); //function or array

	const _histogram = histogram()
		.value(_value)
		.domain(_domain);
	const _scaleX = scaleTime();
	const _scaleY = scaleLinear();

	function exports(data){

		const rootDom = _||this;

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
			.ticks(4);

		//Generate DOM
		select(rootDom)
			.classed('timeline',true)
			.attr('transform',`translate(${_margin.l}, ${_margin.t})`);
		const lineComponent = select(rootDom)
			.selectAll('.line')
			.data([timelineData]);
		lineComponent.enter().append('path')
			.attr('class','line')
			.merge(lineComponent)
			.attr('d',lineGenerator)
			.style('fill','none');
		const areaComponent = select(rootDom)
			.selectAll('.area')
			.data([timelineData]);
		areaComponent.enter().append('path')
			.attr('class','area')
			.merge(areaComponent)
			.attr('d',areaGenerator);

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