import {select,range} from 'd3';
import Histogram from './Histogram';

function DurationGraph(dom){

	let _svg;
	let _histogram;

	function exports(data){

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

			_histogram = Histogram(_svg.append('g').node())
				.width(width)
				.height(height)
				.value(d => d.duration)
				.domain([0,60*60])
				.thresholds(range(0,60*60,5*60))
				.parseLabel(d => `${Math.floor(d/60)}`)
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

export default DurationGraph(document.getElementById('duration-graph-main'));