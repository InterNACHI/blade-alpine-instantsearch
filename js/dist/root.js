var BladeAlpineInstantSearch=function(){function n(){return(n=Object.assign||function(n){for(var t=1;t<arguments.length;t++){var e=arguments[t];for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(n[r]=e[r])}return n}).apply(this,arguments)}return function(t,e,r){var a=function(a,i){var c=JSON.parse(i),o=c.applicationId,s=c.searchKey,d=function(n,t){if(null==n)return{};var e,r,a={},i=Object.keys(n);for(r=0;r<i.length;r++)t.indexOf(e=i[r])>=0||(a[e]=n[e]);return a}(c,["applicationId","searchKey"]),u=t(o,s),l=e(n({searchClient:u},d)),f=[];return a.addBladeAlpineInstantSearchWidget=function(n,t,e){var a=r["connect"+n](e);f.push(a(t))},{init:function(){l.addWidgets(f),l.start()}}};return a.widget=function(t,r,a,i){var c=JSON.parse(a);return n({},i,{name:r,config:c,instantsearch:e,first_render:!0,init:function(){t.parentNode.closest("[data-instantsearch-context]").addBladeAlpineInstantSearchWidget(r,c,this.render.bind(this))},render:function(n,t){var e=this;this.first_render=t,Object.entries(n).forEach(function(n){var t=n[0],a=n[1];e[t]=a,["boolean","number","string"].includes(typeof a)&&console.log(r,t,a)})}})},a}(window.algoliasearch,window.instantsearch,window.instantsearch.connectors)}();
