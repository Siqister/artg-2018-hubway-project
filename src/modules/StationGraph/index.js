import {nest, select, min, max, map} from 'd3';

function StationGraph(dom){

	let _w, _h;
	let _onUnmount = () => {};
	let tripsData;
	let stationsData;

	function exports(data, stations){

		//Recompute internal variables
		_w = dom.clientWidth;
		_h = dom.clientHeight;

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

		// root
		// 	.style('background','blue')
		// 	.transition()
		// 	.style('background','red');

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