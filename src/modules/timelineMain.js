import {select, min, max} from 'd3';
import Timeline from './Timeline';

function TimelineModule(dom){

	let _svg;
	let _timeline;

	function exports(data){

		//Recompute dom attributes
		const width = dom.clientWidth;
		const height = dom.clientHeight-30;

		//Data discovery
		const t0 = min(data, d => d.t0);
		const t1 = max(data, d => d.t1);

		if(!_svg){
			_svg = select(dom)
				.style('position','relative')
				.append('svg')
				.style('position','absolute')
				.style('bottom',0)
				.attr('width',width)
				.attr('height',height);

			_timeline = Timeline(_svg.append('g').node())
				.width(width)
				.height(height)
				.value(d => d.t0)
				.domain([t0,t1])
				.call(null,data);

			const anno = select(dom)
				.append('div')
				.style('padding','10px 10px 0')
				.attr('class','anno');
			anno.append('label')
				.html('Trip Activity');
		}else{
			_svg
				.attr('width',width)
				.attr('height',height);

			_timeline
				.width(width)
				.height(height)
				.domain([t0,t1])
				.call(null,data);
		}

	}


	return exports;

}

const timelineMain = TimelineModule(document.getElementById('timeline-main'));
export default timelineMain;