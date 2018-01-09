import {nest, select, min, max, geoMercator, scaleSqrt, forceSimulation, forceCollide, forceRadial, path} from 'd3';
import {MainPath, ArcPath} from '../TripBalanceGraph';

function StationGraph(dom){

	let _w, _h;
	let _onUnmount = () => {};
	let tripsData;
	let stationsData;
	let departuresByStation;
	let arrivalsByStation;
	let highlightStation;

	//Reference to internal nodes
	let svg;
	let canvas;
	let ctx;
	//Projection
	const projection = geoMercator()
		.scale(180000)
		.center([-71.081543, 42.348560]);
	//Scale
	const scaleSize = scaleSqrt()
		.domain([0,3000])
		.range([3,20]);
	//Force layout
	const force = forceSimulation();
	const collide = forceCollide().radius(d => d.r1 + 2);
	const radial = forceRadial();
	//Path generator functions
	let arcPath, mainPath;

	function exports(data, stations){

		//Recompute internal variables
		_w = dom.clientWidth - 30; //TODO: account for inner padding
		_h = dom.clientHeight;

		projection.translate([_w/2, _h/2]);

		tripsData = data;
		departuresByStation = nest()
			.key(d => d.station0)
			.rollup(xs => xs.length)
			.map(tripsData);
		arrivalsByStation = nest()
			.key(d => d.station1)
			.rollup(xs => xs.length)
			.map(tripsData);
		stationsData = stations.map(s => {
			const [x,y] = projection([s.lng,s.lat]);
			const departureVolume = departuresByStation.get(s.id_short)?departuresByStation.get(s.id_short):0;
			const arrivalVolume = arrivalsByStation.get(s.id_short)?arrivalsByStation.get(s.id_short):0;
			const r1 = scaleSize(departureVolume);
			const r0 = scaleSize(arrivalVolume);
			return {
				...s,
				departureVolume,
				arrivalVolume,
				r0,
				r1,
				x,
				y
			}
		});

		//Update forces
		radial
			.x(_w/2)
			.y(_h/2)
			.radius(Math.min(_w, _h)/2-50);
		force
			.force('collide',collide)
			.force('radial',radial)
			.alpha(1);

		redraw();
	}

	function redraw(){

		//Build/update DOM
		let root = select(dom)
			.selectAll('.station-graph')
			.data([1]);
		root = root.enter()
			.append('div')
			.call(selection => {
				if(selection.size()>0) select(dom).selectAll('.module').remove();
			})
			.merge(root)
			.attr('class','station-graph module');

		//Build/update visualization layers
		canvas = root
			.selectAll('.viz-layer-canvas')
			.data([1]);
		canvas = canvas.enter()
			.append('canvas')
			.attr('class','viz-layer-canvas')
			.merge(canvas)
			.attr('width',_w)
			.attr('height',_h)
			.style('position','absolute')
			.style('top',0)
			.style('left',0);
		ctx = canvas.node().getContext('2d');
		//Instantiate path generator function with the correct ctx
		arcPath = ArcPath(ctx);
		mainPath = MainPath(ctx);

		svg = root
			.selectAll('.viz-layer-svg')
			.data([1]);
		svg = svg.enter()
			.append('svg')
			.attr('class','viz-layer-svg')
			.merge(svg)
			.attr('width',_w)
			.attr('height',_h)
			.style('position','absolute')
			.style('top',0)
			.style('left',0)
			.call(renderStations);

		//Unmount button
		let unmountButton = root
			.selectAll('.unmount')
			.data([1]);
		unmountButton = unmountButton.enter()
			.append('a')
			.attr('href','#')
			.attr('class','hubway-button unmount')
			.merge(unmountButton)
			.html('List view')
			.on('click', _onUnmount);

	}

	function renderStations(_){

		let stationLinks = _.selectAll('.link')
			.data(stationsData, d => d.id_short);
		stationLinks = stationLinks.enter()
			.append('path')
			.attr('class','link')
			.merge(stationLinks)
			.style('fill','rgba(255,255,255,.1)');

		let stationNodes = _.selectAll('.station')
			.data(stationsData, d => d.id_short);
		stationNodes = stationNodes.enter()
			.append('circle')
			.attr('class','station')
			.attr('transform', d => `translate(${_w/2},${_h/2})`)
			.merge(stationNodes)
			.attr('r', d => d.r1 - 2)
			.on('mouseenter',d => {
				highlightStation = d.id_short;
			})
			.on('mouseleave',d => {
				highlightStation = undefined;
			});

		force
			.on('tick', () => {
				stationNodes
					.attr('transform', d => `translate(${d.x},${d.y})`);
				
				//renderLinks();

				stationLinks
					.attr('transform', d => {
						const {x,y} = d;
						const angle = Math.atan2((y-_h/2),(x-_w/2))*180/Math.PI;
						return `translate(${_w/2},${_h/2})rotate(${angle})`;
					})
					.attr('d', (d,i) => {
						const {x,y,r0,r1} = d;
						const l = Math.sqrt( (x-_w/2)*(x-_w/2) + (y-_h/2)*(y-_h/2) );
						return i%5===0?ArcPath(path())({r0,r1,l}).toString():MainPath(path())({r0,r1,l}).toString();
					});

			})
			.on('end', () => {})
			.nodes(stationsData)
			.restart();
	}

	function renderLinks(){

		ctx.clearRect(0, 0, _w, _h);
		ctx.fillStyle = 'rgba(0,0,0,.05)';

		stationsData.forEach((s,i) => {
			if(i%10 > 0) return;
			const {x,y,r0,r1} = s;
			const l = Math.sqrt( (x-_w/2)*(x-_w/2) + (y-_h/2)*(y-_h/2) );
			const angle = Math.atan((y-_h/2)/(x-_w/2)); //in radian

			ctx.translate(_w/2, _h/2);
			ctx.rotate(angle);
			arcPath({r0,r1,l});
			ctx.resetTransform();
		});

		ctx.fill();

	}

	exports.onUnmount = function(fn){
		if(typeof(fn) === 'undefined') return _onUnmount;
		_onUnmount = fn;
		return this;
	}

	return exports;

}

export default StationGraph;