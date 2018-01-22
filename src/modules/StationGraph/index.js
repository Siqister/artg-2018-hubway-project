import {nest, select, map, min, geoMercator, scaleSqrt, forceSimulation, forceCollide, forceRadial, path, dispatch} from 'd3';
import {MainPath, ArcPath} from '../TripBalanceGraph';
import TimeInput from '../TimeInput';
const crossfilter = require('crossfilter');
const Matrix = require('transformation-matrix-js').Matrix; //https://www.npmjs.com/package/transformation-matrix-js

function StationGraph(dom){

	let _w, _h;
	let _onUnmount = () => {};
	let _onTooltipEnter = () => {};
	let _onTooltipLeave = () => {};
	let tripsData;
	let stationsData;
	let departuresByStation;
	let arrivalsByStation;
	let highlightStation;
	let locationLookup = new Map();

	//Reference to internal nodes
	let timeReadout;
	let svg;
	let canvas; //main canvas, with blurring effect
	let canvasOffScreen;
	let canvasLabel; //secondary canvas, for labels
	let ctx;
	let ctxLabel;
	let ctxOffScreen;
	let stationLinks;
	let stationNodes;

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
	let animationId;
	let cf; //crossfilter
	let t0; //crossfilter dimension
	let t1; //crossfilter dimension
	let t = new Date(); //global state for current animation time
	let tEndTrigger = new Date(4000,0,1);
	let tStartTrigger = new Date(2000,0,1);
	let tripToEnd; //reference to the first trip currently in progress to end

	//Module internal event dispatch
	const _dispatch = dispatch('trip:ended', 'trip:started');

	//TimeInput module
	let timeInput = TimeInput()
		.onInput(inputTime => {
			t = inputTime;
		});

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
		stationsData = stations.map((s,i) => {
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
				y,
				arc: i%3===0?true:false
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
		//<canvas> without crossfading; for labels etc.
		canvasLabel = root
			.selectAll('.viz-layer-canvas-label')
			.data([1]);
		canvasLabel = canvasLabel.enter()
			.append('canvas')
			.attr('class','viz-layer-canvas-label')
			.merge(canvasLabel)
			.attr('width',_w)
			.attr('height',_h)
			.style('position','absolute')
			.style('top',0)
			.style('left',0)
			.style('pointer-events','none');
		ctxLabel = canvasLabel.node().getContext('2d');

		//<canvas> with crossfading
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

		//<svg>
		svg = root
			.selectAll('.viz-layer-svg')
			.data([1]);
		const svgEnter = svg.enter()
			.insert('svg','.viz-layer-canvas-label')
			.attr('class','viz-layer-svg');
		svg = svgEnter.merge(svg)
			.attr('width',_w)
			.attr('height',_h)
			.style('position','absolute')
			.style('top',0)
			.style('left',0)
			.call(renderStations);

		//time readout
		timeReadout = root
			.selectAll('.time-readout')
			.data([t]);
		timeReadout = timeReadout.enter()
			.append('div')
			.attr('class','time-readout')
			.style('position','absolute')
			.style('top','22.5px')
			.style('right',0)
			.style('transform','translate(0,-50%)')
			.each(timeInput);
		//timeReadout.html('Preparing animation...');

		//Gradient def
		const defs = svgEnter.append('defs');
		const gradient1 = defs
			.append('linearGradient')
			.attr('id','grad1')
			.attr('x1','0%')
			.attr('y1','0%')
			.attr('x2','100%')
			.attr('y2','0%');
		gradient1.append('stop')
			.attr('offset','0%')
			.attr('style','stop-color:rgba(255,255,255,0)');
		gradient1.append('stop')
			.attr('offset','20%')
			.attr('style','stop-color:rgba(255,255,255,0)');
		gradient1.append('stop')
			.attr('offset','100%')
			.attr('style','stop-color:rgba(255,255,255,.2)');
		const gradient2 = defs
			.append('linearGradient')
			.attr('id','grad2')
			.attr('x1','0%')
			.attr('y1','0%')
			.attr('x2','100%')
			.attr('y2','0%');
		gradient2.append('stop')
			.attr('offset','0%')
			.attr('style','stop-color:rgba(0,0,200,0)')
		gradient2.append('stop')
			.attr('offset','20%')
			.attr('style','stop-color:rgba(0,0,200,0)');
		gradient2.append('stop')
			.attr('offset','100%')
			.attr('style','stop-color:rgba(0,0,200,1)');

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
			.on('click', () => {
				//Preparation before unmounting
				if(animationId) cancelAnimationFrame(animationId);
				_onUnmount();
			});

	}

	function renderStations(_){

		//For each station, render a link and a node
		//Links
		//'d' attribute is updated on force.tick
		stationLinks = _.selectAll('.station-link')
			.data(stationsData, d => d.id_short);
		stationLinks = stationLinks.enter()
			.append('path')
			.attr('class','station-link')
			.style('fill','url(#grad1)')
			.merge(stationLinks)
			.call(renderLinks, highlightStation);

		//Nodes
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
				_onTooltipEnter(d);
			})
			.on('mouseleave',d => {
				highlightStation = undefined;
				stationLinks.call(renderLinks, highlightStation);
				_onTooltipLeave();
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

		//Style nodes and links based on trip activity
		_dispatch.on('trip:ended', trip => {
			stationLinks.filter(d => d.id_short === trip.station1)
				.style('fill','url(#grad1)');
			stationNodes.filter(d => d.id_short === trip.station1)
				.select('circle')
				.attr('r', d => d.r1 + 2)
				.transition()
				.attr('r', d => d.r1 - 2)
				.style('fill', 'white');
		});
		_dispatch.on('trip:started', trip => {
			stationLinks.filter(d => d.id_short === trip.station1)
				.style('fill','url(#grad2)');
			stationNodes.filter(d => d.id_short === trip.station1)
				.select('circle')
				.style('fill', 'rgb(255,255,0)');
		});

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
					.attr('d', d => {
						const {x,y,r0,r1} = d;
						const l = Math.sqrt( (x-_w/2)*(x-_w/2) + (y-_h/2)*(y-_h/2) );
						return d.arc?ArcPath(path())({r0,r1,l}).toString():MainPath(path())({r0,r1,l}).toString();
					});

			})
			.on('end', () => {

				console.log('force layout:end');

				//Prepare for trips animation
				//Create new crossfilter and dimensions
				cf = crossfilter(tripsData);
				t0 = cf.dimension(d => d.t0);
				t1 = cf.dimension(d => d.t1);
				t = min(tripsData, d => d.t0);

				//For stations with arc path, compute offset from center
				//Used to render trips
				stationsData.forEach(s => {
					if(!s.arc) return;
					s.offsetFromCenter = Math.sqrt((s.x-_w/2)*(s.x-_w/2) + (s.y-_h/2)*(s.y-_h/2));
					s.offsetAngleFromCenter = Math.atan2((s.y-_h/2),(s.x-_w/2));
				});

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
			.style('fill','rgba(0,0,0,.3)');
			//.style('fill','#00ff80');

	}

	function renderTrips(){

		//Derive trips currently in progress
		t0.filter([-Infinity,t]);
		t1.filter([t,Infinity]);
		const tripsInProgress = t1.bottom(Infinity);

		if(t > tEndTrigger){
			_dispatch.call('trip:ended', null, tripToEnd);
		}
		tripToEnd = tripsInProgress[0];
		tEndTrigger = tripToEnd?tripToEnd.t1:new Date(4000,0,1);

		ctxOffScreen.clearRect(0,0,_w,_h);
		ctxOffScreen.drawImage(canvas.node(),0,0);
		ctx.clearRect(0,0,_w,_h);
		ctx.save(); 
		ctx.globalAlpha = .85;
		ctx.drawImage(canvasOffScreen,0,0);
		ctx.restore();

		ctxLabel.clearRect(0,0,_w,_h);

		const tripPath2d = new Path2D();
		const highlightPath2d = new Path2D();
		const tripLinePath2d = new Path2D();
		const stationOutlinePath2d = new Path2D();

		//transformation matrix used to interpolate along semi-circular arcs
		const _m = new Matrix();

		ctx.beginPath();
		ctxLabel.beginPath();
		ctxLabel.fillStyle = 'rgba(255,255,0,.6)';
		ctxLabel.font = '12px Miso';

		tripsInProgress.forEach(trip => {
			//TODO: re-implement this based on a station at the center
			//Current trip and stations
			const {station0:s0, station1:s1, t0, t1, bike} = trip;
			if(!locationLookup.get(s0) || !locationLookup.get(s1)){
				return;
			}
			const station0 = locationLookup.get(s0);
			const station1 = locationLookup.get(s1);

			const {x:x0,y:y0,arc:arc0} = station0;
			const {x:x1,y:y1,arc:arc1} = station1;
			const centerX = _w/2, centerY = _h/2;
			const pct = (t.valueOf() - t0.valueOf())/(t1.valueOf() - t0.valueOf());
			const path2d = s1 === highlightStation? highlightPath2d : tripPath2d;
			const r = s1 === highlightStation? 3 : 3;
			let _x, _y;

			//Interpolate current trip location
			//Straight line interpolation or interpolation along a path
			if(!arc0){
				_x = x0*(1-pct) + centerX*pct;
				_y = y0*(1-pct) + centerY*pct;
				path2d.moveTo(_x+r, _y);
				path2d.arc(_x, _y, r, 0, Math.PI*2);
				ctx.moveTo(x0,y0);
				ctx.moveTo(_x,_y);
			}else{
				//No-op for now
			}

			if(!arc1){
				//Simple straight line interpolation
				_x = centerX*(1-pct) + x1*pct;
				_y = centerY*(1-pct) + y1*pct;
				path2d.moveTo(_x+r, _y);
				path2d.arc(_x, _y, r, 0, Math.PI*2);
				ctx.moveTo(_x,_y);
				ctx.lineTo(x1,y1);
			}else{
				//Interpolation along semi-circular arc
				const {offsetFromCenter,offsetAngleFromCenter} = station1;
				//xy in untransformed space
				const tempX = offsetFromCenter/2 - Math.cos(pct*Math.PI)*offsetFromCenter/2;
				const tempY = -Math.sin(pct*Math.PI)*offsetFromCenter/2;
				//transformation matrix
				_m
					.translate(centerX, centerY)
					.rotate(offsetAngleFromCenter);
				//xy in transformed space
				const _xy = _m.applyToPoint(tempX, tempY);
				_x = _xy.x;
				_y = _xy.y;
				//Draw line in transformed space
				_m.applyToContext(ctx);
				ctx.moveTo(offsetFromCenter, 0);
				ctx.arc(offsetFromCenter/2,0,offsetFromCenter/2,0,Math.PI*(pct-1),true);
				ctx.moveTo(tempX, tempY);
				path2d.moveTo(_x+r, _y);
				path2d.arc(_x, _y, r, 0, Math.PI*2);

				//Reset
				_m.reset();
				_m.applyToContext(ctx);

			}	

			//If s1 is highlighted
			if(s1 === highlightStation){
				ctxLabel.moveTo(_x+r+5, _y);
				ctxLabel.arc(_x, _y, r+5, 0, Math.PI*2);
			}

			//Labels
			ctxLabel.fillStyle = 'rgba(255,255,0,.6)';
			ctxLabel.fillText(bike, _x+5, _y+5);

			//Trigger trip:started
			if(trip.t0 > tStartTrigger){
				tStartTrigger = trip.t0;
				_dispatch.call('trip:started',null,trip);
			}

		});

		//Fill highlights
		ctxLabel.closePath();
		ctxLabel.fillStyle = 'rgba(255,255,255,.6)';
		ctxLabel.fill();
		//Stroking trip line
		ctx.closePath();
		ctx.strokeStyle = 'rgba(255,255,0,.2)';
		ctx.stroke();
		//Fill current trip location
		ctx.fillStyle = 'rgb(255,255,0)';
		ctx.fill(tripPath2d);
		//Fill current trip location (highlighted)
		ctx.fillStyle = 'rgba(255,255,255,1)';
		ctx.fill(highlightPath2d);

		//Update time and request next frame
		timeReadout.select('.readout').html(t.toUTCString());
		t = new Date(t.valueOf() + 18000);
		animationId = requestAnimationFrame(renderTrips);

	}

	exports.onUnmount = function(fn){
		if(typeof(fn) === 'undefined') return _onUnmount;
		_onUnmount = fn;
		return this;
	}

	exports.onTooltipEnter = function(fn){
		if(typeof(fn) === 'undefined') return _onTooltipEnter;
		_onTooltipEnter = fn;
		return this;
	}

	exports.onTooltipLeave = function(fn){
		if(typeof(fn) === 'undefined') return _onTooltipLeave;
		_onTooltipLeave = fn;
		return this;
	}
	return exports;

}

export default StationGraph;