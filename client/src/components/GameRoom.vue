<template>
  <div>
    <v-row level class="u-padding">
      <v-col c="4" class="u-padding">
        <!-- <LeftView /> -->

        <v-card equalHeight>
          <v-card-title>
            <v-row>
              <v-col c="6" dynamicOffset="center">
                <circular-count-down-timer
                  :initial-value="parseInt(game.counter)"
                  @finish="finished"
                  ref="countdown"
                  :size="100"
                  :show-minute="false"
                  :seconds-fill-color="'#42b983'"
                  :seconds-stroke-color="'#2c3e50'"
                  :underneath-stroke-color="'white'"
                  :show-hour="false"
                ></circular-count-down-timer>
              </v-col>
            </v-row>
          </v-card-title>
          <v-card-content>
            <div v-if="game.clients" class="u-center u-padding">
              <v-space />

              <div v-for="client in game.clients" :key="client.clientId">
                <v-tile>
                  <v-avatar
                    text="P"
                    size="small"
                    v-bind:style="{ backgroundColor: client.color=='red'?'#f25f5c':client.color=='green'?'#ffe066':'#247ba0' }"
                  ></v-avatar>

                  <v-tile-content v-bind:title="client.playerName"></v-tile-content>
                  <!-- <v-tile-buttons> -->
                  <v-btn primary small class="u-center">{{client.score}}</v-btn>
                  <!-- </v-tile-buttons> -->
                </v-tile>
                <v-space />
              </div>
            </div>
          </v-card-content>
          <v-card-actions>
            <v-row class="u-center">
              <v-btn outline color="dark" @click="$emit('leave', gameId)">Leave</v-btn>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col c="8" class="u-padding">
        <v-frame height="28rem">
          <template v-slot:header>
            <div v-if="gameOver" class="u-text-center">
              GameOver
              <i>Winner is {{ winner.playerName }}</i>
            </div>
          </template>

          <v-container class="u-center">
            <tbody>
              <tr v-for="row in game.balls[0]" :key="row">
                <td v-for="col in game.balls[1]" :key="col">
                  <button
                    class="button"
                    v-bind:id="'ball' + row+col"
                    v-bind:ref="'ball' + row+col"
                    v-bind:tag="1 + row+col"
                    v-on:click="clicked('ball' + row+col)"
                  >{{ row* game.balls[0] + col-game.balls[0]}}</button>
                </td>
              </tr>
            </tbody>
          </v-container>
        </v-frame>
      </v-col>
    </v-row>

    <div></div>
  </div>
</template>

<script>
export default {
  name: "GameRoom",
  props: ["data"],
  data() {
    return {
      winner: {
        clientId: "",
        playerName: ""
      },
      socket: this.data.socket,
      gameId: this.data.game.gameId,
      playerColor: this.data.playerColor,
      game: this.data.game,
      clientId: this.data.clientId,
      gameOver: false
    };
  },

  mounted() {
    // console.log(this.game);
    this.socket.on("gameState", game => {
      this.game = game;
      for (const ball of Object.keys(this.game.state)) {
        if (this.$refs[ball][0]) {
          this.$refs[ball][0].style.backgroundColor =
            game.state[ball] == "red"
              ? "#f25f5c"
              : game.state[ball] == "green"
              ? "#ffe066"
              : "#247ba0";
          this.$refs[ball][0].style.color = "#fff";
        }
      }
    });
  },
  methods: {
    finished() {
      console.log("finished");
      this.gameOver = true;
      var score = 0;
      this.game.clients.forEach(client => {
        if (client.score >= score) {
          score = client.score;
          this.winner.clientId = client.clientId;
          this.winner.playerName = client.playerName;
        }
      });
      this.socket.emit("end", this.gameId);
    },
    clicked(_data) {
      if (!this.gameOver) {
        this.$refs[_data][0].style.backgroundColor =
          this.playerColor == "red"
            ? "#f25f5c"
            : this.playerColor == "green"
            ? "#ffe066"
            : "#247ba0";
        this.$refs[_data][0].style.color = "#fff";
        const data = {
          clientId: this.clientId,
          gameId: this.gameId,
          ballId: _data,
          color: this.playerColor
        };
        this.socket.emit("play", data);
      }
    }
  }
};
</script>

<style>
.button {
  width: 50px;
  height: 50px;
  float: left;
  border: 1px solid black;
}
/* .board {
  display: flexbox;
} */
</style>
