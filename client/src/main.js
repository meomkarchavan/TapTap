import Vue from 'vue';
import App from './App.vue';
import router from './router';

Vue.config.productionTip = false;
import CircularCountDownTimer from 'vue-circular-count-down-timer';
Vue.use(CircularCountDownTimer);

import VueCirrus from 'vue-cirrus';
import 'vue-cirrus/dist/vue-cirrus.css';

Vue.use(VueCirrus);

import VueClipboard from 'vue-clipboard2';
Vue.use(VueClipboard);

new Vue({
	router,
	render: (h) => h(App),
}).$mount('#app');
