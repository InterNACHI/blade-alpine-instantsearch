var BladeAlpineInstantSearch=function(){var t,n,i;return t=window.algoliasearch,n=window.instantsearch,i=window.instantsearch.connectors,function(){return{search:"",algolia:null,hits:[],widgetState:{},init:function(){var i=this,e=JSON.parse(this.$el.dataset.config),a=t(e.id,e.key);this.algolia=n({indexName:e.index,searchClient:a});var r=e.widgets.map(function(t){return i.connectWidget(t)});this.algolia.addWidgets(r),setTimeout(function(){return i.algolia.start()},1),setTimeout(function(){return console.log(i.hits)},1e3)},getWidgetState:function(t,n,i){void 0===i&&(i={});var e=n.split(".");e.unshift(t);try{return e.reduce(function(t,n){if(!(n in t))throw!1;return t[n]},this.widgetState)}catch(t){return i}},connectWidget:function(t){var n="connect"+t.name;return i[n](this[n].bind(this))(t.config)},connectSearchBox:function(t,n){var i=t.query,e=t.refine;n&&this.$watch("search",function(t){return e(t)}),this.search=i},connectHits:function(t){this.hits=t.hits},connectRefinementList:function(t){this.widgetState[t.widgetParams.id]=t}}}}();