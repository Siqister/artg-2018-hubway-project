import {nest, select, min, max, geoMercator} from 'd3';

function StationGraph(dom){

	let _w, _h;
	let _onUnmount = () => {};
	let tripsData;
	let stationsData;

	//Projection
	const projection = geoMercator()
		.scale(180000)
		.center([-71.081543, 42.348560]);

	function exports(data, stations){

		//Recompute internal variables
		_w = dom.clientWidth;
		_h = dom.clientHeight;

		projection.translate([_w/2, _h/2]);

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

	exports.onUnmount = function(fn){
		if(typeof(fn) === 'undefined') return _onUnmount;
		_onUnmount = fn;
		return this;
	}

	return exports;

}

export default StationGraph;