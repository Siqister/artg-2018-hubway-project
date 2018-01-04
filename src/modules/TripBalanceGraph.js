import {select, scaleLinear, path} from 'd3';

export default function TripBalanceGraph(_){

	let _w = 500, _h = 300; //default width and height
	let _margin = {t:30,r:30,b:30,l:30};
	let _origin;
	let _domain; //How to scale the thickness of the graph
	const _scaleSize = scaleLinear();

	function exports(data){

		const dom = _ || this;
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
		const _path = select(dom)
			.classed('trip-balance-graph',true)
			.attr('transform',`translate(${_margin.l}, ${_margin.t + h/2})`)
			.selectAll('path')
			.data([{r0:_scaleSize(arrivals), r1:_scaleSize(departures)}]);
		_path.enter()
			.append('path')
			.merge(_path)
			.call(drawPath);
		//origin destination
		const originNode = select(dom)
			.selectAll('.origin')
			.data([arrivals,departures]);
		const originNodeEnter = originNode.enter()
			.append('g').attr('class','origin');
		originNodeEnter.append('circle')
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

	function drawPath(root){

		const {r0, r1} = root.datum();
		const l = _w - _margin.l - _margin.r - r0 - r1;
		const angle = Math.acos(Math.abs(r1-r0)/l);
		const p = path();

		p.moveTo(r0+Math.cos(angle)*r0,0-Math.sin(angle)*r0);
		p.arc(r0,0,r0,-angle,angle,true);
		p.arc(l+r0,0,r1,angle,-angle,true);
		p.closePath();

		root
			.transition()
			.duration(1000)
			.attr('d',p.toString())
			.style('fill','rgba(0,0,0,.3)');

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

function TripBalanceContainer(_){

	let _tripBalanceGraph;
	let _svg;

	function exports(data){

		const dom = _ || this;
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

			_tripBalanceGraph = TripBalanceGraph(_svg.append('g').node())
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