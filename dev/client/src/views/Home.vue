<template>
	<div class="home">
		<BlockGame />
	</div>
</template>
<script>
import BlockGame from '../components/BlockGame.vue';

// import VueInputUi from 'vue-input-ui';
// import 'vue-input-ui/dist/vue-input-ui.css';

// Vue.component('vue-input-ui', VueInputUi);

export default {
	name: 'Home',
	components: {
		BlockGame,
	},
};
</script>
