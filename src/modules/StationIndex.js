import {select} from 'd3';

export default function StationIndex(_){

	let _total = 0;
	let _stationsPerPage = 1;
	let _currentPage = 0;
	let _text = 'All stations';
	let _onClickCallback = () => {};

	function exports(data){

		const rootDom = _ || this;

		const text = select(rootDom)
			.selectAll('.text')
			.data([_text]);
		text.enter().append('span')
			.attr('class','text')
			.merge(text)
			.text(d => d);
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
				_onClickCallback(i);
			})
			.html('')
			.style('background','rgb(0,50,200)')
			.filter((d,i) => i === _currentPage)
			.html(_currentPage)
			.style('background','white');
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

	exports.onClick = function(cb){
		if(typeof(cb)==='undefined') return _onClickCallback;
		_onClickCallback = cb;
		return this;
	}

	return exports;

}

