import {select,path} from 'd3';

export default function LoadingStatus(_){

	let _w = 60,
		_h = 60;

	function exports(){

		const rootDom = _ || this;

		const _path = path();
		_path.moveTo(_w/2-2, 0);
		_path.arc(0, 0, _h/2-2, 0, Math.PI,true);

		select(rootDom)
			.classed('loading-status',true)
			.style('position','absolute')
			.style('top','50%')
			.style('left','50%')
			.style('transform','translate(-50%,-50%)')
			.style('z-index','9999') //always on top
			.append('svg')
			.attr('width',_w)
			.attr('height',_h)
			.append('path')
			.attr('transform',`translate(${_w/2},${_h/2})`)
			.attr('d',_path.toString())
			.style('fill','none')
			.style('stroke','white')
			.style('stroke-width','3px');

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

	return exports;

}

export const loadingStatusSm = LoadingStatus().width(24).height(24);
export const loadingStatusMd = LoadingStatus();