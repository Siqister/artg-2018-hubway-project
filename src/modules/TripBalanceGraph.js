import {select, scaleLinear, path} from 'd3';
import {loadingStatusSm} from './LoadingStatus';

export default function TripBalanceGraph(_){

	let _w = 500, _h = 300; //default width and height
	let _margin = {t:30,r:30,b:30,l:30};
	let _origin;
	let _domain; //How to scale the thickness of the graph
	const _scaleSize = scaleLinear();

	function exports(data){

		const svg = select(_||this);
		const w = _w - _margin.l - _margin.r;
		const h = _h - _margin.t - _margin.b;

		//Transform data
		const arrivals = data.filter(d => d.station1 === _origin).length;
		const departures = data.filter(d => d.station0 === _origin).length;

		//Update scale
		_domain = _domain || [0,Math.max(arrivals,departures)];
		_scaleSize
			.domain(_domain)
			.range([5,h/2]);

		//Build/update DOM
		let rootDom = svg
			.selectAll('.trip-balance-graph')
			.data([data]);
		rootDom.exit().remove();
		rootDom = rootDom.enter().append('g')
			.call(selection => {
				if(selection.size()>0) svg.selectAll('.viz-module').remove(); //clear any existing .viz-module that is not .trip-balance-graph
			})
			.merge(rootDom)
			.attr('transform',`translate(${_margin.l}, ${_margin.t + h/2})`)
			.attr('class','trip-balance-graph viz-module');

		//3 <path> 
		const _leftToRight = rootDom
			.selectAll('.left-to-right')
			.data([{r0:_scaleSize(arrivals), r1:_scaleSize(departures)}]);
		_leftToRight.enter()
			.append('path')
			.attr('class','left-to-right')
			//.attr('d',mainPath)
			.style('fill-opacity',0)
			.style('fill','rgb(0,50,255)')
			.merge(_leftToRight)
			.transition()
			.duration(1000)
			.attr('d', sidePath.bind(null,'top'))
			.style('fill-opacity',1)
			.style('fill','rgb(0,0,200)');

		const _rightToLeft = rootDom
			.selectAll('.right-to-left')
			.data([{r0:_scaleSize(arrivals), r1:_scaleSize(departures)}]);
		_rightToLeft.enter()
			.append('path')
			.attr('class','right-to-left')
			.style('fill-opacity',0)
			.style('fill','rgb(0,50,255)')
			.merge(_rightToLeft)
			.transition()
			.duration(1000)
			.attr('d', sidePath.bind(null,'bottom'))
			.style('fill-opacity',.7)
			.style('fill','white');

		const _mainPath = rootDom
			.selectAll('.main-path')
			.data([{r0:_scaleSize(arrivals), r1:_scaleSize(departures)}]);
		_mainPath.enter()
			.append('path')
			.attr('class','main-path')
			.style('fill','rgb(0,50,255)')
			.merge(_mainPath)
			.transition()
			.duration(1000)
			.attr('d',mainPath)
			.style('fill','rgba(0,0,0,.3)');
		//origin destination
		const originNode = rootDom
			.selectAll('.origin')
			.data([arrivals,departures]);
		const originNodeEnter = originNode.enter()
			.append('g').attr('class','origin');
		originNodeEnter.append('circle')
			.attr('r',0)
			.style('fill','none')
			.style('stroke','rgba(255,255,255,.5)')
			.style('stroke-dasharray','1px 2px');
		originNodeEnter.append('text')
			.attr('text-anchor','middle')
			.attr('dy','5px');
		const originNodeMerge = originNodeEnter.merge(originNode)
			.transition()
			.attr('transform',(d,i) => {
				return i===0?
					`translate(${_scaleSize(d)})`:`translate(${w-_scaleSize(d)})`
			});
		originNodeMerge
			.select('circle')
			.attr('r', d => _scaleSize(d) - 4);
		originNodeMerge
			.select('text')
			.text(d => d);
	}

	function mainPath(datum){

		const {r0, r1} = datum;
		const l = _w - _margin.l - _margin.r - r0 - r1;
		const angle = Math.acos(Math.abs(r1-r0)/l);
		const p = path();

		p.moveTo(r0+Math.cos(angle)*r0,0-Math.sin(angle)*r0);
		p.arc(r0,0,r0,-angle,angle,true);
		p.arc(l+r0,0,r1,angle,-angle,true);
		p.closePath();

		return p.toString();
	}

	function sidePath(side, datum){

		const {r0, r1} = datum;
		const w = _w - _margin.l - _margin.r;
		const l = w - r0 - r1;
		const center = r0 + l/2;
		const p = path();

		if(side==='top'){
			p.moveTo(0,0);
			p.arc(center,0,center,-Math.PI,0,false);
			p.arc(l+r0,0,r0,0,Math.PI,false);
			p.arc(center,0,center-r0*2,0,-Math.PI,true);
			p.arc(r0,0,r0,0,Math.PI,false);
			p.closePath();
		}else{
			p.moveTo(0,0);
			p.arc(l+r0,0,r1,-Math.PI,0,false);
			p.arc(center,0,w-center,0,Math.PI,false);
			p.arc(r0,0,r1,-Math.PI,0,false);
			p.arc(center,0,center-r0-r1,-Math.PI,0,true);
			p.closePath();
		}

		return p.toString();

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

	exports.origin = function(_){
		if(typeof(_)==='undefined') return _origin;
		_origin = _;
		return this;
	}

	exports.domain = function(_){
		if(typeof(_)==='undefined') return _origin;
		_domain = _;
		return this;
	}

	return exports;

}

function TripBalanceContainer(dom){

	let _tripBalanceGraph;
	let _svg;

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

		const width = dom.clientWidth;
		const height = dom.clientHeight - 30;

		if(!_svg){
			_svg = select(dom)
				.style('position','relative')
				.append('svg')
				.style('position','absolute')
				.style('bottom',0)
				.attr('width',width)
				.attr('height',height);

			const anno = select(dom)
				.append('div')
				.style('padding','10px 10px 0')
				.attr('class','anno');
			anno.append('label')
				.html('Departure vs. Arrival at Station');

			_tripBalanceGraph = TripBalanceGraph(_svg.node())
				.width(width)
				.height(height)
				.origin('22');
			_tripBalanceGraph
				.call(null,data);
		}else{
			_svg
				.attr('width',width)
				.attr('height',height);

			_tripBalanceGraph
				.width(width)
				.height(height)
				.call(null,data);
		}
	}

	return exports;

}

const tripBalanceMain = TripBalanceContainer(document.getElementById('trip-balance-main'));

export {tripBalanceMain}