String.prototype.capitalize = function(){
	return this.replace(/^./, function(letter){
		return letter.toUpperCase();
	});
}
App = {
	options: {
		engine: 'cakephp',
		url: 'localhost/cherry'
	},
	base: function( singular, plural ){

		if( this.constructor != App.base ){
			return new App.base(singular, plural);
		}

		var self = this;
			self.plural = plural;
			self.singular = singular;
		
		self._set = function( key, value ){
			self[key] = value;
		}
		return self;
	},
	request: function(url, data, callback){
		var url = App.options.url + '/' + url;
		if( data.constructor == Function && !callback )
			$.get(url, data /*, 'json' */);
		else 
			$.post(url, data, callback /*, 'json' */);
	},
	setup: function( options ){
		this.options = $.extend(this.options, options);
	}
};


App.base.prototype = {
	constructor: App.base,
	validator: null,
	checkator: [],
	find: function(){
		App.request( this.plural + '/list', { limit:5 } , function(){

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
	_toDataFormat: function( key, attr ){
		var str = '['+ key +']';
		if( App.options.engine == 'cakephp' )
			str = 'data[' + this.singular.capitalize() +']' + str ;
		else
			str = this.singular + str;

		if( attr ) str += '['+attr+']';

		return str;
	},
	_makeFields: function(){
		var defaults = {
				'Number':{ type:'number' },
				'String':{ type:'text' },
				'Date':{ type:'date' }			
			},
			fields = {};
		
		$.each( this.validator, function(name, type){
			var attr = defaults[ type.name ];
				attr.label = name;
			fields[name] = attr;
		});
		
		return fields;
	},
	makeForm: function( data ){

		var fields = data.fields ? $.extend(this._makeFields(), data.fields ) : this._makeFields();
		delete data.fields;
		
		var data = $.extend({
			title: 'Formulário',
			resource: this.singular,
			fields: fields
		}, data );

		console.log(data);
		console.log('KKKk...')

		return tmpl('cherry-form', data);
	},
	serialize: function(){
		var data = this.getAll(),
			self = this,
			serialized = {};

		$.each(data, function( key, value ){
			if( value.constructor == Date ){
				var day = value.getDate();
				serialized[ self._toDataFormat( key, 'day' ) ] = day < 10 ? '0' + day : day + '';
				serialized[ self._toDataFormat( key, 'year') ] = value.getFullYear() + '';
				serialized[ self._toDataFormat( key, 'month') ] = value.getMonth() + 1 + '';
			} else serialized[ self._toDataFormat( key ) ] = value;
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