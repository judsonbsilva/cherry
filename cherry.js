App = {
	url: 'http://localhost/neofaciliti',
	base: function( name , model){

		if( this.constructor != App.base ){
			return new App.base(name, model);
		}

		var self = this;
			self.name = name;
			self.model = model;
		
		self._set = function( key, value ){
			self[key] = value;
		}
		return self;
	},
	request: function(url, data, callback){
		var url = App.url + '/' + url;
		if( data.constructor == Function && !callback )
			$.get(url, data, /* 'json' */);
		else 
			$.post(url, data, callback, /* 'json' */);
	},
	setup: function( options ){
		var options = $.extend({
			engine: 'cakephp',
			url: 'localhost/cherry'
		}, options);
	}
};


App.base.prototype = {
	constructor: App.base,
	validator: null,
	checkator: [],
	find: function(){
		App.request( this.name + '/list', { limit:5 } , function(){

		});
	},	
	setup: function( validation ){
		this.validator = validation;
		return this;
	},
	validate: function(){
		if( !this.validator ){ return true; }

		var data = this.getAll(),
			validation = true,
			self = this;

		$.each(data, function( key, value ){
			if( value.constructor != self.validator[key] ){
				validation = false;
			}
		});
		return validation;
	},
	getAll: function(){
		return this.data || {};
	},
	get: function( key ){
		return this.data[key] || null;
	},
	set: function( object , value ){
		if( object.constructor == String && value ){
			key = object; object = {};
			object[key] = value;
		}
		object = $.extend( this.getAll() , object);
		this._set('data', object); 
		return this;
	},
	_ToCakeFormat: function( key, attr ){
		var str = 'data[' + this.model +']['+key+']';
		if( attr ) str += '['+attr+']';

		return str;
	},
	serialize: function(){
		var data = this.getAll(),
			self = this,
			serialized = {};

		$.each(data, function( key, value ){
			if( value.constructor == Date ){
				var day = value.getDate();
				serialized[ self._toCakeFormat( key, 'day' ) ] = day < 10 ? '0' + day : day + '';
				serialized[ self._toCakeFormat( key, 'year') ] = value.getFullYear() + '';
				serialized[ self._toCakeFormat( key, 'month') ] = value.getMonth() + 1 + '';
			} else serialized[ self._toCakeFormat( key ) ] = value;
		});

		return serialized;
	},
	beforeSend: function( fn ){
		this.checkator.push( fn );
	},
	_beforeCall: function(){
		var self = this;
		$.each( this.checkator, function( fn ){
			if( fn ) fn.call(self);
		});
	},
	create: function(callback){
		this._beforeCall();
		if( this.validate() ){
			App.request( this.name + '/add', this.serialize(), callback);
		} else {
			callback({ error: 'Erro na validação dos dados' });
		}
	},
	edit: function(){
		this._beforeCall();
		if( this.validate() ){
			App.request( this.name + '/add', this.serialize(), callback);
		} else {
			callback({ error: 'Erro na validação dos dados' });
		}
	}

}