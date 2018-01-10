import {nest, select, map, min, geoMercator, scaleSqrt, forceSimulation, forceCollide, forceRadial, path} from 'd3';
import {MainPath, ArcPath} from '../TripBalanceGraph';
const crossfilter = require('crossfilter');

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
	let canvasOffScreen;
	let ctx;
	let ctxOffScreen;
	let stationLinks;
	let stationNodes;
	let locationLookup = new Map();
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

	//Animation related
	let cf;
	let t0;
	let t1;
	let t;

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
		stationsData.forEach(s => {
			locationLookup.set(s.id_short,s);
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
			.style('left',0)
			.style('pointer-events','none');
		ctx = canvas.node().getContext('2d');

		if(!canvasOffScreen){
			canvasOffScreen = document.createElement('canvas');
			ctxOffScreen = canvasOffScreen.getContext('2d');
		}
		canvasOffScreen.width = _w;
		canvasOffScreen.height = _h;

		svg = root
			.selectAll('.viz-layer-svg')
			.data([1]);
		const svgEnter = svg.enter()
			.insert('svg','.viz-layer-canvas')
			.attr('class','viz-layer-svg');
		svg = svgEnter.merge(svg)
			.attr('width',_w)
			.attr('height',_h)
			.style('position','absolute')
			.style('top',0)
			.style('left',0)
			.call(renderStations);
		//Gradient def
		const gradient = svgEnter.append('defs')
			.append('linearGradient')
			.attr('id','grad1')
			.attr('x1','0%')
			.attr('y1','0%')
			.attr('x2','100%')
			.attr('y2','0%');
		gradient.append('stop')
			.attr('offset','0%')
			.attr('style','stop-color:rgba(255,255,255,0)')
		gradient.append('stop')
			.attr('offset','20%')
			.attr('style','stop-color:rgba(255,255,255,0)')
		gradient.append('stop')
			.attr('offset','100%')
			.attr('style','stop-color:rgba(255,255,255,.2)');

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

		stationLinks = _.selectAll('.station-link')
			.data(stationsData, d => d.id_short);
		stationLinks = stationLinks.enter()
			.append('path')
			.attr('class','station-link')
			.style('fill','url(#grad1)')
			.merge(stationLinks)
			.call(renderLinks, highlightStation);

		stationNodes = _.selectAll('.station-node')
			.data(stationsData, d => d.id_short);
		const stationNodesEnter = stationNodes.enter()
			.append('g')
			.attr('class','station-node')
			.attr('transform', d => `translate(${_w/2},${_h/2})`);
		stationNodesEnter.append('circle').attr('r',0);
		stationNodesEnter.append('text').attr('text-anchor','middle').attr('dy',4)
		stationNodes = stationNodesEnter.merge(stationNodes)
			.on('mouseenter',d => {
				highlightStation = d.id_short;
				stationLinks.call(renderLinks, highlightStation);
			})
			.on('mouseleave',d => {
				highlightStation = undefined;
				stationLinks.call(renderLinks, highlightStation);
			});
		stationNodes
			.select('circle')
			.transition()
			.attr('r', d => d.r1 - 2);
		stationNodes
			.select('text')
			.text('')
			.filter(d => d.r1 > 15)
			.text(d => `${d.code3}`);

		force
			.on('tick', () => {
				stationNodes
					.attr('transform', d => `translate(${d.x},${d.y})`);
				
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
			.on('end', () => {

				console.log('force layout:end');
				console.log(locationLookup);

				//Prepare for trips animation
				//Create new crossfilter and dimensions
				cf = crossfilter(tripsData);
				t0 = cf.dimension(d => d.t0);
				t1 = cf.dimension(d => d.t1);
				t = min(tripsData, d => d.t0);

				//layout is stabilized
				//Render trips
				renderTrips();

			})
			.nodes(stationsData)
			.restart();
	}

	function renderLinks(_links, _highlight){

		_links
			.style('fill','url(#grad1)')
			.filter(d => d.id_short === _highlight)
			.style('fill','#00ff80');

	}

	function renderTrips(){

		//Derive trips currently in progress
		t0.filter([-Infinity,t]);
		t1.filter([t,Infinity]);
		const tripsInProgress = t1.bottom(Infinity);

		ctxOffScreen.clearRect(0,0,_w,_h);
		ctxOffScreen.drawImage(canvas.node(),0,0);
		ctx.clearRect(0,0,_w,_h);
		ctx.save(); 
		ctx.globalAlpha = .75;
		ctx.drawImage(canvasOffScreen,0,0);
		ctx.restore();

		const tripPath2d = new Path2D();
		const highlightPath2d = new Path2D();
		const stationOutlinePath2d = new Path2D();

		tripsInProgress.forEach(trip => {
			//TODO: re-implement this based on a station at the center
			const {station0, station1, t0, t1} = trip;

			if(!locationLookup.get(station0) || !locationLookup.get(station1)){
				return;
			}

			const {x:x0,y:y0} = locationLookup.get(station0);
			const {x:x1,y:y1} = locationLookup.get(station1);
			const centerX = _w/2, centerY = _h/2;
			const pct = (t.valueOf() - t0.valueOf())/(t1.valueOf() - t0.valueOf());
			const path2d = trip.station1 === highlightStation? highlightPath2d : tripPath2d;
			const r = trip.station1 === highlightStation? 5 : 3;

			//Interpolate current trip location
			let _x = x0*(1-pct) + centerX*pct;
			let _y = y0*(1-pct) + centerY*pct;
			path2d.moveTo(_x+r, _y);
			path2d.arc(_x, _y, r, 0, Math.PI*2);

			_x = centerX*(1-pct) + x1*pct;
			_y = centerY*(1-pct) + y1*pct;
			path2d.moveTo(_x+r, _y);
			path2d.arc(_x, _y, r, 0, Math.PI*2);

			//Outline target station
			const r1 = locationLookup.get(station1).r1;
			stationOutlinePath2d.moveTo(x1+r1+3,y1);
			stationOutlinePath2d.arc(x1,y1,r1+3,0,Math.PI*2);
		});

		ctx.fillStyle = 'rgb(255,255,0)';
		ctx.fill(tripPath2d);
		ctx.fillStyle = 'rgba(0,0,0,.3)';
		ctx.fill(highlightPath2d);
		ctx.strokeStyle = 'rgb(255,255,0)';
		ctx.strokeWidth = '2px';
		ctx.stroke(stationOutlinePath2d);

		//Update time and request next frame
		t = new Date(t.valueOf() + 24000);
		requestAnimationFrame(renderTrips);

	}

	exports.onUnmount = function(fn){
		if(typeof(fn) === 'undefined') return _onUnmount;
		_onUnmount = fn;
		return this;
	}

	return exports;

}

export default StationGraph;