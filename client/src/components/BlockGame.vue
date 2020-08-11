<template>
  <div>
    <v-snackbar v-model="snackbar" position="topCenter">{{snackbarMessage}}</v-snackbar>

    <kinesis-container>
      <kinesis-element :strength="20" type="depth" perspective="0">
        <v-headline size="3" uppercase>TapTap</v-headline>
      </kinesis-element>

      <v-container v-if="!this.playerName && !this.menu && !this.inGame" id="hero-body">
        <!-- <kinesis-container> -->
        <kinesis-element :strength="10" type="depth"></kinesis-element>

        <v-row class="u-center">
          <v-col>
            <kinesis-element :strength="10" type="depth">
              <h2 class="u-text-center">
                <v-input-field
                  pilled
                  title="Enter Your Name"
                  label="Player Name"
                  infoText="Player Name"
                  v-model="name"
                ></v-input-field>
              </h2>

              <v-btn color="dark" v-on:click="nameAdded(name)" outline class="u-center">Lets Go !</v-btn>
            </kinesis-element>
          </v-col>
        </v-row>
        <!-- </kinesis-container> -->
      </v-container>

      <v-container v-if="!this.inGame &&  this.menu" class="u-center uppercase u-text-center">
        <v-row>
          <v-col c="6" dynamicOffset="center">
            <v-card equalHeight>
              <v-card-title>
                <v-row>
                  <v-col c="12">
                    <p>Create Game</p>
                  </v-col>
                </v-row>
              </v-card-title>
              <v-card-content>
                <v-row>
                  <v-col fluid c="4" dynamicOffset="center">
                    Time
                    <v-space></v-space>

                    <input
                      pilled
                      v-model="time"
                      type="number"
                      min="5"
                      max="60"
                      placeholder="Time?"
                      class="form-group-input"
                    />
                  </v-col>
                  <!-- <v-space></v-space> -->
                  <v-col fluid c="8" dynamicOffset="center">
                    Tiles
                    <v-space></v-space>

                    <v-dropdown>
                      <template v-slot:button>
                        <v-btn dropdown tooltipText="Select Grid Of Game">Tiles</v-btn>
                      </template>
                      <v-dropdown-item @click="balls=[3,3]">3x3</v-dropdown-item>
                      <v-dropdown-item @click="balls=[4,4]">4x4</v-dropdown-item>
                      <v-dropdown-item @click="balls=[5,5]">5x5</v-dropdown-item>
                    </v-dropdown>
                  </v-col>
                </v-row>
                <v-row>
                  <div v-if="gameId">
                    <strong>{{ gameId }}</strong>
                    <br />
                    <span style="font-size: 0.5rem;">Share this Game ID With Your Friends</span>
                  </div>
                  <div v-else>
                    <v-space large></v-space>
                  </div>
                </v-row>
              </v-card-content>
              <v-card-actions>
                <v-row class="u-center">
                  <v-col fluid>
                    <v-btn
                      outline
                      color="dark"
                      v-on:click="create(time, balls)"
                      v-clipboard:copy="gameId"
                      v-clipboard:success="onCopy"
                    >Create Room</v-btn>
                  </v-col>
                  <v-col fluid>
                    <v-btn outline color="dark" v-on:click="startGame">Start Game</v-btn>
                  </v-col>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col c="6" dynamicOffset="center">
            <v-card equalHeight>
              <v-card-title>
                <v-row>
                  <v-col c="6" dynamicOffset="center">
                    <p>Join Game</p>
                  </v-col>
                </v-row>
              </v-card-title>
              <v-card-content>
                <p>Paste the Game ID Bellow</p>
                <v-row>
                  <input
                    pilled
                    v-model="gameId"
                    type="text"
                    placeholder="Game Id"
                    class="form-group-input"
                    infoText="Share this With Your Friends"
                  />
                </v-row>
                <div v-if="game.clients && typeof game.clients !== 'undefined'" class="u-center">
                  Connected
                  <v-space></v-space>

                  <v-tile v-for="client in game.clients" :key="client.clientId">
                    <v-avatar
                      text="P"
                      size="small"
                      v-bind:style="{ backgroundColor: client.color=='red'?'#f25f5c':client.color=='green'?'#ffe066':'#247ba0' }"
                    ></v-avatar>

                    <v-tile-content v-bind:title="client.playerName"></v-tile-content>
                    <!-- <v-tile-buttons> -->
                    <v-btn primary small class="u-center">Poke</v-btn>
                    <!-- </v-tile-buttons> -->
                  </v-tile>
                </div>
              </v-card-content>
              <v-card-actions>
                <v-row class="u-center">
                  <v-col fluid>
                    <v-btn outline color="dark" v-on:click="join">Join Game</v-btn>
                  </v-col>
                  <v-col fluid v-if="inRoom">
                    <v-btn outline color="dark" @click="leave">Leave</v-btn>
                  </v-col>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <v-container v-if="this.inGame">
        <GameRoom
          v-bind:data="{
					game: this.game,
					socket: this.socket,
					playerColor: this.playerColor,
					clientId: this.clientId,
				}"
          v-on:leave="leave"
        />
      </v-container>
    </kinesis-container>
  </div>
</template>

<script>
import io from "socket.io-client";
import GameRoom from "@/components/GameRoom.vue";

export default {
  name: "BlockGame",
  data() {
    return {
      fakeGame: {
        gameId: "d41168e2-ff11-4ec9-b4f3-6d84ad81409e",
        balls: [5, 5],
        ownerName: "",
        ownerid: "oD2LhNZrSymr1PbwAAFq",
        clients: [
          {
            playerName: "Player 1",
            clientId: "oD2LhNZrSymr1PbwAAFq",
            score: 0,
            color: "red"
          }
        ],
        gameOver: false,
        counter: 10,
        started: true
      },
      snackbar: false,
      name: "",
      socket: {},
      context: {},
      clientId: "",
      gameId: "",
      playerName: "",
      game: {},
      snackbarMessage: "",
      inGame: false,
      inRoom: false,
      balls: [5, 5],
      time: 10,
      playerColor: "red",
      menu: false
    };
  },
  components: {
    GameRoom
  },
  created() {
    this.socket = io("http://192.168.43.43:3000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    });
  },
  mounted() {
    this.socket.on("error", function() {
      this.socket.socket.reconnect();
    });
    this.socket.on("gameState", game => {
      this.game.clients = game.clients;
    });
    this.socket.on("clientId", data => {
      // console.log(data);
      this.clientId = data;
    });
    this.socket.on("create", data => {
      this.gameId = data.gameId;
      this.onCopy();
    });
    this.socket.on("_error", error => {
      this.snackbar = !this.snackbar;
      this.snackbarMessage = error.message;
    });
    this.socket.on("join", game => {
      this.game = game;
      if (this.game.clients.length != 0) {
        this.game.clients.forEach(c => {
          if (c.clientId === this.socket.id) {
            this.playerColor = c.color;
          }
        });
      }
    });
    this.socket.on("start", () => {
      this.game.started = true;
      this.inGame = true;
      this.menu = false;
    });
  },
  methods: {
    onCopy: function() {
      this.$copyText(this.gameId);
      this.snackbar = !this.snackbar;
      this.snackbarMessage = "Game ID Coppied to Clipboard :)";
    },
    nameAdded(name) {
      this.playerName = name;
      this.menu = true;
    },
    leave() {
      // console.log(data);
      this.inGame = false;
      this.inRoom = false;
      this.menu = true;
      delete this.game.clients;
      this.socket.emit("leave", {
        gameId: this.gameId,
        clientId: this.clientId
      });
      this.gameId = "";
    },
    startGame() {
      if (
        Object.keys(this.game).length === 0 &&
        this.game.constructor === Object &&
        this.gameId === ""
      ) {
        this.snackbar = !this.snackbar;
        this.snackbarMessage = "Create A Game First";
      } else {
        if (
          !this.gameId === "" ||
          !this.game.clients ||
          this.game.clients.length <= 1
        ) {
          this.snackbar = !this.snackbar;
          this.snackbarMessage =
            "Game has less players ask your friends to join :)";
        } else {
          if (this.game.ownerid === this.clientId) {
            this.game.started = true;
            this.inGame = true;
            this.socket.emit("start", this.game);
          } else {
            this.snackbar = !this.snackbar;
            this.snackbarMessage = "Only Server Owner can start the game";
          }
        }
      }
    },

    join() {
      if (!this.gameId) {
        this.snackbar = !this.snackbar;
        this.snackbarMessage = "Enter Game ID First";
      } else {
        if (this.inRoom) {
          this.snackbar = !this.snackbar;
          this.snackbarMessage = "Already In A Room :)";
        } else {
          this.inRoom = true;
          const data = {};
          data["playerName"] = this.playerName;
          data["clientId"] = this.clientId;
          data["gameId"] = this.gameId;
          this.socket.emit("join", data);
        }
      }
    },
    create(time, balls) {
      const data = {
        clientId: this.clientId,
        playerName: this.playerName,
        time: time,
        balls: balls
      };
      this.socket.emit("create", data);
    }
  }
};
</script>

<style scoped>
</style>
