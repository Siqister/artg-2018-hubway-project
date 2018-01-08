import {select, event as d3Event} from 'd3';

export default function StationIndex(_){

	let _total = 0;
	let _stationsPerPage = 1;
	let _currentPage = 0;
	let _text = 'All stations';
	let _onPaginationCallback = () => {};
	let _onStationNodeStateChange = () => {};

	function exports(data){

		const rootDom = _ || this;

		//text component
		const text = select(rootDom)
			.selectAll('.text')
			.data([_text]);
		text.enter().append('span')
			.attr('class','text')
			.merge(text)
			.text(d => d);

		//stationNodeState selector
		const stationNodeStates = select(rootDom)
			.selectAll('.station-node-state')
			.data([data._stationNodeStates]);
		const stationNodeStatesEnter = stationNodeStates.enter()
			.append('div')
			.attr('class','station-node-state');
		const stationNodeStatesButton = stationNodeStates.merge(stationNodeStatesEnter)
			.selectAll('.hubway-button')
			.data(d => d, (d,i) => i);
		stationNodeStatesButton.enter()
			.append('a')
			.attr('class','hubway-button')
			.attr('href','#')
			.merge(stationNodeStatesButton)
			.on('click', (d,i) => {
				d3Event.preventDefault();
				_onStationNodeStateChange(i);
			})
			.html(d => d)
			.classed('active', (d,i) => i === data._currentStationNodeState);
		stationNodeStatesButton.exit().remove();


		//page navigation component
		const pageNav = select(rootDom)
			.selectAll('.page-nav')
			.data([1]);
		const pageNavButton = pageNav.enter().append('div')
			.attr('class','page-nav')
			.merge(pageNav)
			.selectAll('.page-nav-button')
			.data(Array.from({length:Math.ceil(_total/_stationsPerPage)}));
		pageNavButton.enter()
			.append('span')
			.attr('class','page-nav-button')
			.merge(pageNavButton)
			.on('click', (d,i) => {
				d3Event.preventDefault();
				_onPaginationCallback(i);
			})
			.style('border','1px solid rgba(255,255,255,.3)')
			.style('background','none')
			.filter((d,i) => i === _currentPage)
			.style('background','white')
			.style('border','none');
		pageNavButton.exit().remove();

	}

	exports.total = function(_){
		if(typeof(_)==='undefined') return _total;
		_total = _;
		return this;
	}

	exports.stationsPerPage = function(_){
		if(typeof(_)==='undefined') return _stationsPerPage;
		_stationsPerPage = _;
		return this;
	}

	exports.text = function(_){
		if(typeof(_)==='undefined') return _text;
		_text = _;
		return this;
	}

	exports.currentPage = function(_){
		if(typeof(_)==='undefined') return _currentPage;
		_currentPage = _;
		return this;
	}

	exports.onPagination = function(cb){
		if(typeof(cb)==='undefined') return _onPaginationCallback;
		_onPaginationCallback = cb;
		return this;
	}

	exports.onStationNodeStateChange = function(cb){
		if(typeof(cb)==='undefined') return _onStationNodeStateChange;
		_onStationNodeStateChange = cb;
		return this;
	}

	return exports;

}

