import {select, histogram, extent, scaleLinear, max, range} from 'd3';
import {loadingStatusSm} from './LoadingStatus';

export default function Histogram(_){

	//Internal variables and state
	let _w = 500, _h = 300; //default width and height
	let _margin = {t:10,r:10,b:40,l:10};
	let _value = d => d; //accessor function
	let _domain = extent; //accessor function or [x0, x1]
	let _thresholds = []; //function or array
	let _parseLabel = d => d;

	const _histogram = histogram()
		.value(_value)
		.domain(_domain);
	const _scaleX = scaleLinear();
	const _scaleY = scaleLinear();

	function exports(data){

		const rootDom = _||this;

		//Update state
		const w = _w - _margin.l - _margin.r;
		const h = _h - _margin.t - _margin.b;
		_histogram
			.value(_value)
			.domain(_domain)
			.thresholds(_thresholds);
		const bins = _histogram(data);
		_scaleX.domain(_domain)
			.range([0,w]);
		_scaleY.domain([0, max(bins, d => d.length)])
			.range([h,0]);

		//Build / update DOM
		/**
		rootDOM / <g.histogram>
			- <g.bins>
				- <g.bin>
		**/
		const binsContainer =  select(rootDom)
			.attr('class','histogram')
			.selectAll('.bins')
			.data([1]);
		const binsContainerEnter = binsContainer
			.enter()
			.append('g')
			.attr('class','bins');

		const binsUpdate = 	binsContainer.merge(binsContainerEnter)
			.attr('transform',`translate(${_margin.l}, ${_margin.t})`)
			.selectAll('.bin')
			.data(bins, (d,i) => i);
		const binsEnter = binsUpdate.enter()
			.append('g')
			.attr('class','bin');
		binsEnter.append('rect').attr('class','bottom')
			.attr('y', d => h)
			.attr('width', d => (_scaleX(d.x1) - _scaleX(d.x0) - 1))
			.attr('height', d => 0);
		binsEnter.append('rect').attr('class','top')
			.attr('y', d => h)
			.attr('width', d => (_scaleX(d.x1) - _scaleX(d.x0) - 1))
			.attr('height', d => 0);
		binsEnter
			.filter((d,i) => i%2===0)
			.append('text').attr('class','label');

		const binsMerge = binsEnter.merge(binsUpdate)
			.attr('transform', d => `translate(${_scaleX(d.x0)},0)`);
		binsMerge.select('.top')
			.transition()
			.attr('y', d => _scaleY(d.length))
			.attr('width', d => (_scaleX(d.x1) - _scaleX(d.x0) - 1))
			.attr('height', d => (h - _scaleY(d.length)));
		binsMerge.select('.bottom')
			.transition()
			.attr('y', d => 0)
			.attr('width', d => (_scaleX(d.x1) - _scaleX(d.x0) - 1))
			.attr('height', d => h);
		binsMerge.select('.label')
			.attr('transform',`translate(3,${h+3})rotate(90)`)
			.text(d => `${_parseLabel(d.x0)}-${_parseLabel(d.x1)}`);

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
		_domain = _;
		return this;
	}

	exports.thresholds = function(_){
		if(typeof(_)==='undefined') return _thresholds;
		_thresholds = _;
		return this;
	}

	exports.parseLabel = function(fn){
		if(typeof(fn)==='undefined') return _parseLabel;
		_parseLabel = fn;
		return this;
	}

	return exports;

}

function DurationGraph(dom){

	let _svg;
	let _histogram;

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

		if(!_svg){
			_svg = select(dom)
				.style('position','relative')
				.append('svg')
				.style('position','absolute')
				.style('bottom',0)
				.attr('width',width)
				.attr('height',height);

			_histogram = Histogram(_svg.node())
				.width(width)
				.height(height)
				.value(d => d.duration)
				.domain([0,60*60])
				.thresholds(range(0,60*60,5*60))
				.parseLabel(d => `${Math.floor(d/60)}`);
			_histogram
				.call(null,data);

			const anno = select(dom)
				.append('div')
				.style('padding','10px 10px 0')
				.attr('class','anno');
			anno.append('label')
				.html('Trip Duration');
			anno.append('span')
				.attr('class','pull-right')
				.html('(min.)');
		}else{
			_svg
				.attr('width',width)
				.attr('height',height)

			_histogram
				.width(width)
				.height(height)
				.call(null,data);
		}

	}

	return exports;

}

export const durationGraph = DurationGraph(document.getElementById('duration-graph-main'));