import React, { Component } from "react";
import axios from "axios";
import { OpenVidu } from "openvidu-browser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import NightsStayIcon from "@material-ui/icons/NightsStay";
import HowToVoteIcon from "@material-ui/icons/HowToVote";
import StreamComponent from "./stream/StreamComponent";
import ChatComponent from "./chat/ChatComponent";
import JobCardComponent from "../components/JobComponents/JobCardComponent";
import DayToNightLoading from "../../LoadingPage/DayToNightLoading/DayToNightLoading";
import NightToDayLoading from "../../LoadingPage/NightToDayLoading/NightToDayLoading";
import DeathResultComponent from "../components/JobComponents/DeathResultComponent";
import NewsResultComponent from "../components/JobComponents/NewsResultComponent";
import VoteAnimationComponent from "../components/VotePage/VoteAnimationComponent";
import VoteDoneAnimationComponent from "../components/VotePage/VoteDoneAnimationComponent";
import ExecutionPage from "../components/VotePage/ExecutionPage";

import SharkGameResult from "../../MiniGame/SharkGame/SharkGameResult";
import FishingGame from "../../MiniGame/FishingGame/FishingGameController";
import GameResultPage from "../components/JobComponents/GameResultPage";
import CrazyCard from "../../LoadingPage/JobCard/CrazyCard/CrazyCard";
import DoctorCard from "../../LoadingPage/JobCard/DoctorCard/DoctorCard";
import MafiaCard from "../../LoadingPage/JobCard/MafiaCard/MafiaCard";
import MayorCard from "../../LoadingPage/JobCard/MayorCard/MayorCard";
import NeutralCard from "../../LoadingPage/JobCard/NeutralCard/NeutralCard";
import PoliceCard from "../../LoadingPage/JobCard/PoliceCard/PoliceCard";
import ReporterCard from "../../LoadingPage/JobCard/ReporterCard/ReporterCard";
import ShowRoom from "../components/WaitingRoomPage/ShowRoom";
import WaitingRoomPage from "../components/WaitingRoomPage/WaitingRoomPage";
import DayOctopi from "../components/octopi/DayOctopi";
import NightOctopi from "../components/octopi/NightOctopi";
import MafiaNightOctopi from "../components/octopi/MafiaNightOctopi";
import NightComponent from "../components/MusicComponents/NightComponent";
import VoteAgreeComponent from "../components/MusicComponents/VoteAgreeComponent";
import WaitingComponent from "../components/MusicComponents/WaitingComponent";
import "./OpenViduComponent.css";

import ErrorGuideComponent from "../components/ErrorComponents/ErrorGuideComponent";

import OpenViduLayout from "../layout/openvidu-layout";
import UserModel from "../models/user-model";
import ToolbarComponent from "./toolbar/ToolbarComponent";
import Swal from "sweetalert2";

import { connect } from "react-redux";
import {
  updateUserListforDead,
  updateUserListforSub,
  setLocalUser,
  hasntSkill,
  setShark,
  setFisher,
  setPickUser,
  getMinigame,
  setReporter,
} from "../../../features/gamer/gamerSlice";

import Timer from "../Timer";
import { BASE_URL } from "../../../api/BASE_URL";

import MP_btn1 from "../../../effect/MP_btn1.mp3";
import MP_btn2 from "../../../effect/MP_btn2.mp3";
import MP_bgm1 from "../../../effect/MP_bgm1.mp3";

var localUser = new UserModel();

class OpenViduComponent extends Component {
  constructor(props) {
    super(props);
    this.OPENVIDU_SERVER_URL = "https://i7E106.p.ssafy.io:8443";
    this.OPENVIDU_SERVER_SECRET = this.props.openviduSecret
      ? this.props.openviduSecret
      : "MY_SECRET";
    this.hasBeenUpdated = false;
    this.layout = new OpenViduLayout();
    let hostName = this.props.host ? this.props.host : "HostA";
    let sessionName = this.props.sessionName
      ? this.props.sessionName
      : "SessionA";
    let userName = localStorage.getItem("userName");
    // let bgmAudio = new Audio(MP_bgm1);
    this.remotes = [];
    this.localUserAccessAllowed = false;
    // ?????? ?????????????????? ?????? ?????? ?????? ?????? ??????
    // ?????? chatComponent ???????????? ????????? prop?????? ???????????? ??? ???????????????
    this.ovref = React.createRef();
    this.state = {
      mySessionId: sessionName,
      myUserName: userName,
      session: undefined,
      localUser: undefined,
      subscribers: [],
      chatDisplay: "block",
      currentVideoDevice: undefined,
      page: 0,
      voteWaitPageStart: 0,
      votePageStart: 0,
      agreePageStart: 0,
      votePage: 0,
      agreePage: 0,
      gameNum: 0,
      hostName: hostName,
      userList: ["a", "b", "c", "d"],
      victoryUsers: ["d1", "d2", "d3", "d4", "d5"],
      pickUser: "d2",
      agree: false,
      speakingUsers: [0, 0, 0, 0, 0, 0, 0, 0],
      timer: 0,
      hasSkill: true,
      killed: "??????",
      voteName: "",
      // bgmAudio: bgmAudio,
    };

    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.onbeforeunload = this.onbeforeunload.bind(this);
    this.updateLayout = this.updateLayout.bind(this);
    this.camStatusChanged = this.camStatusChanged.bind(this);
    this.micStatusChanged = this.micStatusChanged.bind(this);
    this.toggleChat = this.toggleChat.bind(this);
    this.changePerson = this.changePerson.bind(this);
    this.checkGameTurn = this.checkGameTurn.bind(this);
  }

  timer(time, user, page, flag, obj) {
    Timer(time, user, page, flag, obj);
  }

  changeTime = (second) => {
    this.setState({ timer: second });
  };

  changePage = (pageNum, gameChoice) => {
    if (pageNum === 20 || pageNum === 30) {
      this.setState({ gameNum: gameChoice });
      this.props.selectGame(gameChoice);
      this.setState({ page: pageNum });
    } else {
      this.setState({ page: pageNum });
    }
  };
  bgmAudio = new Audio(MP_bgm1);

  componentDidMount() {
    const openViduLayoutOptions = {
      maxRatio: 3 / 2, // The narrowest ratio that will be used (default 2x3)
      minRatio: 9 / 16, // The widest ratio that will be used (default 16x9)
      fixedRatio: false, // If this is true then the aspect ratio of the video is maintained and minRatio and maxRatio are ignored (default false)
      bigClass: "OV_big", // The class to add to elements that should be sized bigger
      bigPercentage: 0.8, // The maximum percentage of space the big ones should take up
      bigFixedRatio: false, // fixedRatio for the big ones
      bigMaxRatio: 3 / 2, // The narrowest ratio to use for the big elements (default 2x3)
      bigMinRatio: 9 / 16, // The widest ratio to use for the big elements (default 16x9)
      bigFirst: true, // Whether to place the big one in the top left (true) or bottom right
      animate: true, // Whether you want to animate the transitions
    };

    this.layout.initLayoutContainer(
      document.getElementById("layout"),
      openViduLayoutOptions
    );
    window.addEventListener("beforeunload", this.onbeforeunload);
    window.addEventListener("resize", this.updateLayout);
    this.joinSession();
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onbeforeunload);
    window.removeEventListener("resize", this.updateLayout);
    this.leaveSession();
  }

  onbeforeunload(event) {
    this.leaveSession();
  }

  joinSession() {
    var options = {
      loglevel: 0,
    };
    this.OV = new OpenVidu(options);

    this.setState(
      {
        session: this.OV.initSession(),
      },
      () => {
        this.subscribeToStreamCreated();

        this.connectToSession();
      }
    );
    setTimeout(() => {
      this.state.session.on("publisherStartSpeaking", (event) => {
        const array = event.connection.data.split('"');
        const targetPlayerId = array[3];
        let tmp = [...this.state.speakingUsers];
        {
          this.props.gamerData.userList &&
            this.props.gamerData.userList.map((sub, i) => {
              if (sub.userName === targetPlayerId) {
                tmp[i] = 1;
                this.setState({ speakingUsers: tmp });
              }
            });
        }
      });

      this.state.session.on("publisherStopSpeaking", (event) => {
        const array = event.connection.data.split('"');
        const targetPlayerId = array[3];
        let tmp = [...this.state.speakingUsers];
        {
          this.props.gamerData.userList &&
            this.props.gamerData.userList.map((sub, i) => {
              if (sub.userName === targetPlayerId) {
                tmp[i] = 0;
                this.setState({ speakingUsers: tmp });
              }
            });
        }
      });
    }, 1000);
  }

  connectToSession() {
    if (this.props.token !== undefined) {
      
      this.connect(this.props.token);
    } else {
      this.getToken()
        .then((token) => {
          this.connect(token);
        })
        .catch((error) => {
          if (this.props.error) {
            this.props.error({
              error: error.error,
              messgae: error.message,
              code: error.code,
              status: error.status,
            });
          }
          alert("There was an error getting the token:", error.message);
        });
    }
  }

  connect(token) {
    this.state.session
      .connect(token, { clientData: this.state.myUserName })
      .then(() => {
        this.connectWebCam();
      })
      .catch((error) => {
        if (this.props.error) {
          this.props.error({
            error: error.error,
            messgae: error.message,
            code: error.code,
            status: error.status,
          });
        }
        alert("There was an error connecting to the session:", error.message);
      });
  }

  async connectWebCam() {
    var devices = await this.OV.getDevices();
    var videoDevices = devices.filter((device) => device.kind === "videoinput");

    let publisher = this.OV.initPublisher(undefined, {
      audioSource: undefined,
      videoSource: videoDevices[0].deviceId,
      publishAudio: localUser.isAudioActive(),
      publishVideo: localUser.isVideoActive(),
      resolution: "640x480",
      frameRate: 30,
      insertMode: "APPEND",
    });

    if (this.state.session.capabilities.publish) {
      publisher.on("accessAllowed", () => {
        this.state.session.publish(publisher).then(() => {
          this.updateSubscribers();
          this.localUserAccessAllowed = true;
          if (this.props.joinSession) {
            this.props.joinSession();
          }
        });
      });
    }
    localUser.setNickname(this.state.myUserName);
    localUser.setConnectionId(this.state.session.connection.connectionId);
    localUser.setScreenShareActive(false);
    localUser.setStreamManager(publisher);
    this.subscribeToUserChanged();
    this.subscribeToStreamDestroyed();
    this.sendSignalUserChanged({
      isScreenShareActive: localUser.isScreenShareActive(),
    });

    this.setState(
      { currentVideoDevice: videoDevices[0], localUser: localUser },
      () => {
        this.state.localUser.getStreamManager().on("streamPlaying", (e) => {
          this.updateLayout();
          publisher.videos[0].video.parentElement.classList.remove(
            "custom-class"
          );
        });
      }
    );
    // ?????? ?????? ??? ???????????? [??????] ?????? ??????.
    this.ovref.current.enterNotice();
  }

  updateSubscribers() {
    var subscribers = this.remotes;
    this.setState(
      {
        subscribers: subscribers,
      },
      () => {
        if (this.state.localUser) {
          this.sendSignalUserChanged({
            isAudioActive: this.state.localUser.isAudioActive(),
            isVideoActive: this.state.localUser.isVideoActive(),
            nickname: this.state.localUser.getNickname(),
            isScreenShareActive: this.state.localUser.isScreenShareActive(),
          });
        }
        this.updateLayout();
      }
    );
  }

  leaveSession() {
    const mySession = this.state.session;
    if (mySession) {
      mySession.disconnect();
    }

    // Empty all properties...
    this.OV = null;
    this.setState({
      session: undefined,
      subscribers: [],
      mySessionId: "SessionA",
      myUserName: "OpenVidu_User" + Math.floor(Math.random() * 100),
      localUser: undefined,
    });
    if (this.props.leaveSession) {
      this.props.leaveSession();
    }
  }

  camStatusChanged() {
    localUser.setVideoActive(!localUser.isVideoActive());
    localUser.getStreamManager().publishVideo(localUser.isVideoActive());
    this.sendSignalUserChanged({ isVideoActive: localUser.isVideoActive() });
    this.setState({ localUser: localUser });
  }

  micStatusChanged() {
    localUser.setAudioActive(!localUser.isAudioActive());
    localUser.getStreamManager().publishAudio(localUser.isAudioActive());
    this.sendSignalUserChanged({ isAudioActive: localUser.isAudioActive() });
    this.setState({ localUser: localUser });
  }

  deleteSubscriber(stream) {
    const remoteUsers = this.state.subscribers;
    const userStream = remoteUsers.filter(
      (user) => user.getStreamManager().stream === stream
    )[0];
    let index = remoteUsers.indexOf(userStream, 0);
    if (index > -1) {
      remoteUsers.splice(index, 1);
      this.setState({
        subscribers: remoteUsers,
      });
    }
  }

  subscribeToStreamCreated() {
    this.state.session.on("streamCreated", (event) => {
      const subscriber = this.state.session.subscribe(event.stream, undefined);
      // var subscribers = this.state.subscribers;
      subscriber.on("streamPlaying", (e) => {
        this.checkSomeoneShareScreen();
        subscriber.videos[0].video.parentElement.classList.remove(
          "custom-class"
        );
      });
      const newUser = new UserModel();
      newUser.setStreamManager(subscriber);
      newUser.setConnectionId(event.stream.connection.connectionId);
      newUser.setType("remote");
      const nickname = event.stream.connection.data.split("%")[0];
      newUser.setNickname(JSON.parse(nickname).clientData);
      this.remotes.push(newUser);
      if (this.localUserAccessAllowed) {
        this.updateSubscribers();
      }
    });
  }

  subscribeToStreamDestroyed() {
    // On every Stream destroyed...
    this.state.session.on("streamDestroyed", (event) => {
      const obj = {
        job: this.props.gamerData.job,
      };
      if (obj.job !== undefined && obj.job !== null) {
        this.setState({ page: -1 });
      }
      // Remove the stream from 'subscribers' array
      this.deleteSubscriber(event.stream);
      setTimeout(() => {
        this.checkSomeoneShareScreen();
      }, 20);
      event.preventDefault();
      this.updateLayout();
    });
  }

  subscribeToUserChanged() {
    this.state.session.on("signal:userChanged", (event) => {
      let remoteUsers = this.state.subscribers;
      remoteUsers.forEach((user) => {
        if (user.getConnectionId() === event.from.connectionId) {
          const data = JSON.parse(event.data);
          if (data.isAudioActive !== undefined) {
            user.setAudioActive(data.isAudioActive);
          }
          if (data.isVideoActive !== undefined) {
            user.setVideoActive(data.isVideoActive);
          }
          if (data.nickname !== undefined) {
            user.setNickname(data.nickname);
          }
          if (data.isScreenShareActive !== undefined) {
            user.setScreenShareActive(data.isScreenShareActive);
          }
        }
      });
      this.setState(
        {
          subscribers: remoteUsers,
        },
        () => this.checkSomeoneShareScreen()
      );
    });
  }

  updateLayout() {
    setTimeout(() => {
      this.layout.updateLayout();
    }, 20);
  }

  sendSignalUserChanged(data) {
    const signalOptions = {
      data: JSON.stringify(data),
      type: "userChanged",
    };
    this.state.session.signal(signalOptions);
  }

  checkSomeoneShareScreen() {
    let isScreenShared;
    // return true if at least one passes the test
    isScreenShared =
      this.state.subscribers.some((user) => user.isScreenShareActive()) ||
      localUser.isScreenShareActive();
    const openviduLayoutOptions = {
      maxRatio: 3 / 2,
      minRatio: 9 / 16,
      fixedRatio: isScreenShared,
      bigClass: "OV_big",
      bigPercentage: 0.8,
      bigFixedRatio: false,
      bigMaxRatio: 3 / 2,
      bigMinRatio: 9 / 16,
      bigFirst: true,
      animate: true,
    };
    this.layout.setLayoutOptions(openviduLayoutOptions);
    this.updateLayout();
  }

  toggleChat(property) {
    let display = property;

    if (display === undefined) {
      display = this.state.chatDisplay === "none" ? "block" : "none";
    }
    if (display === "block") {
      this.setState({ chatDisplay: display, messageReceived: false });
    } else {
      this.setState({ chatDisplay: display });
    }
    this.updateLayout();
  }
  // ????????? ??????????????? ??????????????? ???????????? ?????? ??????
  clickBtn = () => {
    var audio = new Audio(MP_btn1);
    audio.volume = 0.1; // ??????
    audio.play();
    if (this.props.waitData.personNum != 8) {
      Swal.fire({
        icon: "warning",
        title: "?????? ?????? ??????",
        text: "8?????? ?????? ?????? ????????? ???????????????",
        background: "#fdfcdc",
        confirmButtonColor: "#f4d35e",
        color: "black",
        customClass: {
          confirmButton: "swalBtnColor",
          popup: "popUp",
        },
      });
    } else {
      this.props.onClickBtn();

      const flag = {
        gameEnd: false, // ??????????????????,
        voteGo: false, // ????????????(???????????? ?????? ?????????),
        agreeVoteGo: false, // ??????????????????(?????? ?????? ?????????)
      };
      const obj = {
        minigameResult: this.props.gamerData.minigameResult,
        job: this.props.gamerData.job,
        hasSkill: this.props.gamerData.hasSkill,
        isDead: this.props.gamerData.isDead,
        shark: this.props.gamerData.shark,
        fisher: this.props.gamerData.fisher,
        reporter: this.props.gamerData.reporter,
        roomChief: this.props.waitData.roomChief,
        gameTime: this.props.waitData.gameTime,
      };

      this.settingLocalUser({ localUser: this.state.localUser });
      this.timer(0, this.state.localUser, 0, flag, obj);
      this.state.localUser.getStreamManager().stream.session.signal({
        type: "pauseBgmAudio",
      });
    }
  };

  clickUser = (e) => {
    console.log("clickUser on child : " + e);
  };
  // ?????? ???????????? ?????? ??????(????????? ?????? ?????????)
  clickBtnVote = () => this.setState({ votePageStart: 1 });
  moveVoteWait = () => this.setState({ voteWaitPageStart: 1 });
  // ?????? ????????? ???????????? ??????
  moveAgree = () => this.setState({ agreePageStart: 1 });

  setVoteName = (data) => {
    this.setState({ voteName: data });
  };

  // ????????? ???????????? ?????? (state??? pickUser??? ????????? userName?????? ?????????)
  selectVote = (gamer, e) => {
    e.preventDefault();
    if (this.state.pickUser === gamer.userName) {
      var audio = new Audio(MP_btn2);
      audio.volume = 0.2; // ??????
      audio.play();
      this.setState({ pickUser: "" });
    } else if (gamer.isDead === false) {
      var audio = new Audio(MP_btn2);
      audio.volume = 0.2; // ??????
      audio.play();
      this.setState({ pickUser: gamer.userName });
    }
  };

  // ??? ?????? ?????? ????????? ????????? ???????????? ?????? (state??? pickUser??? ????????? userName?????? ?????????)
  selectVoteAtNight = (gamer, e) => {
    e.preventDefault();
    if (this.props.gamerData.job === "??????") {
      if (this.state.pickUser === gamer.userName) {
        var audio = new Audio(MP_btn2);
        audio.play();
        audio.volume = 0.2; // ??????
        this.setState({ pickUser: "" });
      } else if (gamer.isDead === false) {
        var audio = new Audio(MP_btn2);
        audio.volume = 0.2; // ??????
        audio.play();
        this.setState({ pickUser: gamer.userName });
      }
    } else {
      if (gamer.userName === this.props.gamerData.userName) {
      } else if (this.state.pickUser === gamer.userName) {
        var audio = new Audio(MP_btn2);
        audio.volume = 0.2; // ??????
        audio.play();
        this.setState({ pickUser: "" });
      } else if (gamer.isDead === false) {
        var audio = new Audio(MP_btn2);
        audio.volume = 0.2; // ??????
        audio.play();
        this.setState({ pickUser: gamer.userName });
      }

      if (this.props.gamerData.job === "??????") {
        if (this.state.hasSkill === true) {
          if (gamer.userName === this.props.gamerData.userName) {
          } else if (this.state.pickUser === gamer.userName) {
            var audio = new Audio(MP_btn2);
            audio.play();
            audio.volume = 0.2; // ??????
            this.setState({ pickUser: "" });
          } else if (gamer.isDead === false) {
            var audio = new Audio(MP_btn2);
            audio.volume = 0.2; // ??????
            audio.play();
            // console.log(g)
            this.setState({ pickUser: gamer.userName });
          }
        }
      }
    }
  };

  // ????????? ?????? ?????? ???????????? ??????
  selectPerson = (gamer, e) => {
    e.preventDefault();
    if (gamer.isDead === false && gamer.gameJob !== "?????????") {
      var audio = new Audio(MP_btn2);
      audio.volume = 0.2; // ??????
      audio.play();
      if (this.state.pickUser === gamer.userName) {
        this.setState({ pickUser: "" });
        // ?????? ??????
        this.pickMafiaNotice(gamer, 1);
      } else {
        this.setState({ pickUser: gamer.userName });
        // ?????? ??????
        this.pickMafiaNotice(gamer, 2);
      }
    }
  };

  // PICKUSER ???????????? ??????
  changePerson = (pickUser) => {
    // ?????? ???????????? ?????? ???
    var audio = new Audio(MP_btn2);
    audio.volume = 0.2; // ??????
    audio.play();
    if (this.state.pickUser === pickUser) {
      this.setState({ pickUser: "" });
    } else {
      this.setState({ pickUser: pickUser.pickUser });
    }
  };

  // ????????? ??? ?????? ?????? => CHATTING MESSAGE ??????
  pickMafiaNotice(gamer, idx) {
    if (idx === 1) {
      const data = {
        mafiaName: this.props.gamerData.userName,
        gamer: { userName: "" },
        nickname: "??????",
        streamId: this.state.localUser.getStreamManager().stream.streamId,
      };
      this.state.localUser.getStreamManager().stream.session.signal({
        data: JSON.stringify(data),
        type: "mafia",
      });
    } else {
      const data = {
        mafiaName: this.props.gamerData.userName,
        gamer: gamer,
        nickname: "??????",
        streamId: this.state.localUser.getStreamManager().stream.streamId,
      };
      this.state.localUser.getStreamManager().stream.session.signal({
        data: JSON.stringify(data),
        type: "mafia",
      });
    }
  }

  clickSharkMiniGame = () => {
    var audio = new Audio(MP_btn1);
    audio.volume = 0.2; // ??????
    audio.play();
    this.state.localUser.getStreamManager().stream.session.signal({
      type: "shark",
    });
    this.state.localUser.getStreamManager().stream.session.signal({
      data: JSON.stringify({ idx: 1 }),
      type: "miniGame",
    });
  };

  clickFisherMiniGame = () => {
    var audio = new Audio(MP_btn1);
    audio.volume = 0.2; // ??????
    audio.play();
    this.state.localUser.getStreamManager().stream.session.signal({
      type: "fisher",
    });
    this.state.localUser.getStreamManager().stream.session.signal({
      data: JSON.stringify({ idx: 0 }),
      type: "miniGame",
    });
  };

  clickBtnGame = (e) => {
    var audio = new Audio(MP_btn2);
    audio.volume = 0.2; // ??????
    audio.play();
  };

  // ?????? ?????? ????????? state.agree??? ??????

  selectAgree = (e) => {
    var audio = new Audio(MP_btn2);
    audio.volume = 0.2; // ??????
    audio.play();
    this.setState({ agree: true });
  };
  // ?????? ??????
  selectDisAgree = (e) => {
    var audio = new Audio(MP_btn2);
    audio.volume = 0.2; // ??????
    audio.play();
    this.setState({ agree: false });
  };

  clickBtnAuto() {
    this.state.voteWaitPageStart = 1;
  }

  // ?????? (?????? ?????? ??????)
  setVictoryUser = (data) => {
    this.setState({ victoryUsers: data });
    if (this.props.waitData.roomChief === this.state.myUserName) {
      this.state.localUser.getStreamManager().stream.session.signal({
        type: "gameEnd",
      });
    }
  };

  // ?????? (????????? gamer : userList <-> subscribers ?????? ?????? ??????)
  settingListForSub = (data) => {
    this.props.setUserListForSub(data);
  };
  settingLocalUser = (data) => {
    this.props.setLocalUser(data);
  };

  settingPickUser = (data) => {
    this.props.setPickUser(data);
  };

  settingHasntSkill = (data) => {
    this.props.setHasntSkill(data);
  };
  settingShark = (data) => {
    this.props.setShark(data);
  };
  settingFisher = (data) => {
    this.props.setFisher(data);
  };
  usingMinigame = (data) => {
    this.props.getMinigame(data);
  };

  updatePickUser = () => {
    axios
      .put(
        `${BASE_URL}/night/update/${
          this.state.pickUser === "" ? "??????" : this.state.pickUser
        }/${this.props.userData.userInfo.userName}`
      )
      .then((res) => {
        this.settingPickUser({ pickUser: this.state.pickUser });
        if (
          (this.props.gamerData.job === "??????" ||
            this.props.gamerData.job === "??????????????????") &&
          this.state.pickUser != ""
        ) {
          let message = "";
          this.props.gamerData.userList.map((user, i) => {
            if (
              this.state.pickUser === user.userName &&
              this.props.gamerData.job === "??????"
            ) {
              message =
                user.gameJob === "?????????"
                  ? `${this.state.pickUser} ?????? ???????????? ????????????.`
                  : `${this.state.pickUser} ?????? ???????????? ????????????.`.replace(
                      / +(?= )/g,
                      ""
                    );
            } else if (
              this.state.pickUser === user.userName &&
              this.props.gamerData.job === "??????????????????"
            ) {
              message =
                this.props.gamerData.crazyjobs[user.subIdx] === "?????????"
                  ? `${this.state.pickUser} ?????? ???????????? ????????????.`
                  : `${this.state.pickUser} ?????? ???????????? ????????????.`.replace(
                      / +(?= )/g,
                      ""
                    );
            }
          });
          const data = {
            message: message,
            nickname: "?????????",
            streamId: this.state.localUser.getStreamManager().stream.streamId,
            isDead: this.props.gamerData.isDead, // ????????? ?????? ??? ????????? ?????? ?????????.
            job: this.props.gamerData.job,
            gameStatus: this.props.gamerData.gameStatus,
          };
          setTimeout(() => {
            this.state.localUser.getStreamManager().stream.session.signal({
              data: JSON.stringify(data),
              type: "chat",
            });
          });
        } else if (
          this.props.gamerData.job === "??????" &&
          this.state.pickUser !== ""
        ) {
          const data = {
            reporter: this.state.pickUser,
          };
          this.state.localUser.getStreamManager().stream.session.signal({
            data: JSON.stringify(data),
            type: "reporter",
          });
          this.settingHasntSkill();
        }
      });
    setTimeout(() => {
      this.nightResult();
    }, 1000);
  };

  nightResult() {
    axios
      .get(`${BASE_URL}/nights/result/${this.props.gamerData.roomId}`)
      .then((res) => {
        this.setState({ killed: res.data.userName });
        if (res.data.userName != "??????" && res.data.userName != "") {
          this.props.updateUserListforDead({ userName: res.data.userName });
        }
      });
  }

  getPickUser = () => {
    return this.state.pickUser;
  };

  resetPickUser = () => {
    this.setState({ pickUser: "" });
  };

  setPickUserState = (userName) => {
    this.setState({ pickUser: userName });
  };

  getHasSkill = () => {
    return this.state.hasSkill;
  };

  getGamerData = () => {
    return this.props.gamerData;
  };
  // ?????? ??????
  updatePickUserAtVote = () => {
    const data = {
      idx: 0,
      roomId: 0,
      userName: this.state.pickUser,
      vote: 0,
    };
    if (this.props.gamerData.isDead === false) {
      if (this.props.gamerData.job === "??????") {
        axios
          .put(`${BASE_URL}/votes/daytime/mayor`, JSON.stringify(data), {
            headers: {
              "Content-Type": `application/json`,
            },
          });
      } else {
        axios
          .put(`${BASE_URL}/votes/daytime/etc`, JSON.stringify(data), {
            headers: {
              "Content-Type": `application/json`,
            },
          });
      }
    }
    setTimeout(() => {
      this.voteResult();
    }, 1000);
  };

  voteResult() {
    if (this.props.waitData.roomChief === this.props.gamerData.userName) {
      axios
        .get(`${BASE_URL}/votes/max/${this.props.gamerData.roomId}`)
        .then((res) => {
          this.setState({ voteName: res.data.userName });

          this.setState({ pickUser: res.data.userName });
          const data = {
            votes: res.data,
            nickname: "?????????",
            streamId: this.state.localUser.getStreamManager().stream.streamId,
          };
          this.state.localUser.getStreamManager().stream.session.signal({
            data: JSON.stringify(data),
            type: "voteResult",
          });
        });
    }
  }

  // ?????? ??????
  updatePickUserAtAgreeVote = () => {
    const data = {
      idx: 0,
      roomId: 0,
      userName: this.state.pickUser,
      vote: 0,
    };
    if (this.props.gamerData.isDead === false) {
      if (this.state.agree) {
        // ??????
        axios
          .put(`${BASE_URL}/votes/agree`, JSON.stringify(data), {
            headers: {
              "Content-Type": `application/json`,
            },
          });
      } else {
        // ??????
        axios
          .put(`${BASE_URL}/votes/disagree`, JSON.stringify(data), {
            headers: {
              "Content-Type": `application/json`,
            },
          });
      }
    }
    setTimeout(() => {
      this.agreeVoteResult();
    }, 1000);
  };

  agreeVoteResult = () => {
    this.setState({ voteName: "skip" });
    if (this.props.waitData.roomChief === this.props.gamerData.userName) {
      axios.get(`${BASE_URL}/votes/${this.state.pickUser}`).then((res) => {

        const data = {
          votes: res.data,
          nickname: "?????????",
          streamId: this.state.localUser.getStreamManager().stream.streamId,
        };
        this.state.localUser.getStreamManager().stream.session.signal({
          data: JSON.stringify(data),
          type: "agreeVoteResult",
        });
      });
    }
  };

  killPickUser = () => {
    this.setState({ voteName: "??????" });
    if (this.state.pickUser === this.props.gamerData.sjh) {
      let victoryUsers = [];

      axios
        .put(`${BASE_URL}/gamers/isvictory/userName/${this.state.pickUser}`)
        .then((res) => {
          axios
            .get(`${BASE_URL}/gamers/winners`)
            .then((res) => {
              victoryUsers = res.data.map((row) => row.userName);
              this.setVictoryUser(victoryUsers);
              this.state.localUser.getStreamManager().stream.session.signal({
                type: "agreeVoteGoAndGameEnd",
              });
            })
            .catch((err) => console.log(err));
        });
    } else {
      const data = {
        idx: 0,
        roomId: 0,
        userName: this.state.pickUser,
        vote: 0,
      };

      axios
        .put(`${BASE_URL}/gamers/dead`, JSON.stringify(data), {
          headers: {
            "Content-Type": `application/json`,
          },
        })
        .then((res) => {
          // ????????? ?????? ??????
          this.state.localUser.getStreamManager().stream.session.signal({
            data: JSON.stringify(data),
            type: "dead",
          });

          let pathName = document.location.pathname.replace("/", "");
          let victoryUsers = [];
          axios
            .get(`${BASE_URL}/gamers/victory/team/${pathName}`)
            .then((res) => {
              if (res.data.victory) {
                axios
                  .put(
                    `${BASE_URL}/gamers/isvictory/gameTeam/${pathName}/${res.data.gameTeam}`
                  )
                  .then((res) => {
                    axios
                      .get(`${BASE_URL}/gamers/winners`)
                      .then((res) => {
                        victoryUsers = res.data.map((row) => row.userName);
                        this.setVictoryUser(victoryUsers);
                        this.state.localUser
                          .getStreamManager()
                          .stream.session.signal({
                            type: "agreeVoteGoAndGameEnd",
                          });
                      })
                      .catch((err) => console.log(err));
                  })
                  .catch((err) => console.log(err));
              } else {
                // ??????????????? ??????
                this.state.localUser.getStreamManager().stream.session.signal({
                  type: "agreeVoteGo",
                });
              }
            })
            .catch((err) => console.log(err));
        });
    }
  };
  // 15??? ???????????? ?????? ?????? (?????? ??????)
  checkGameTurn = () => {

    let pathName = document.location.pathname.replace("/", "");
    let victoryUsers = [];

    if (this.props.gamerData.gameturn === 15) {
      if (this.props.gamerData.userName === this.props.waitData.roomChief) {
        const gameTeam = "?????????";
        axios
          .put(`${BASE_URL}/gamers/isvictory/gameTeam/${pathName}/${gameTeam}`)
          .then((res) => {
            axios
              .get(`${BASE_URL}/gamers/winners`)
              .then((res) => {
                victoryUsers = res.data.map((row) => row.userName);
                this.setVictoryUser(victoryUsers);
              })
              .catch((err) => console.log(err));
          })
          .catch((err) => console.log(err));
      }
    }
  };

  setPlayFalse = () => {
    this.bgmAudio.pause();
    // this.state.bgmAudio.pause();
    // this.setState({ play: false });
  };

  setPlayTrue = () => {
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.05;
    this.bgmAudio.play();
    // this.setState ( {bgmAudio : {loop: true, volume : 0.2}});
    // this.state.bgmAudio.play();
    // this.setState({ play: true });
  };

  setFilter = () => {
    let publisher = this.state.localUser.getStreamManager();
    publisher.stream.applyFilter("FaceOverlayFilter").then((filter) => {
      filter.execMethod("setOverlayedImage", {
        uri: "https://cdn.pixabay.com/photo/2017/02/01/11/13/ancient-2029708_960_720.png",
        offsetXPercent: "-0.2F",
        offsetYPercent: "-0.8F",
        widthPercent: "1.3F",
        heightPercent: "1.0F",
      });
    });
    setTimeout(() => {
    }, 1000);
  };

  resetFilter = () => {
    if (this.state.localUser.streamManager.stream.filter) {
      let publisher = this.state.localUser.getStreamManager();
      publisher.stream
        .removeFilter()
        .catch((error) => {
          console.error(error);
        });
    }
  };

  render() {
    const mySessionId = this.props.sessionName; // !== undefined ? this.props.sessionName : "SessionA";

    const localUser = this.state.localUser;
    var chatDisplay = { display: this.state.chatDisplay };
    return (
      <div>
        {this.state.page == -1 && <ErrorGuideComponent />}
        {this.state.page === 0 && ( // ?????????
          <div>
            <WaitingComponent setPlayTrue={this.setPlayTrue} />
            <WaitingRoomPage
              clickExitBtn={this.props.clickExitBtn}
              setPlayFalse={this.setPlayFalse}
            />
            <div className="d-flex wait-floor">
              <ShowRoom
                roomName={this.props.roomName}
                personNum={this.props.personNum}
                roomId={this.props.roomId}
                roomChief={this.props.roomChief}
                isPrivate={this.props.isPrivate}
                roomPw={this.props.roomPw}
                gameTime={this.props.gameTime}
              />
              <div className="d-flex justify-content-between">
                {localUser !== undefined &&
                  localUser.getStreamManager() !== undefined && (
                    <div className="chating-box ms-3" style={chatDisplay}>
                      <ChatComponent
                        user={localUser}
                        chatDisplay={this.state.chatDisplay}
                        close={this.toggleChat}
                        ref={this.ovref}
                        roomName={this.props.roomName}
                        settingListForSub={this.settingListForSub}
                        subscribers={this.state.subscribers}
                        canSend="true"
                        changeTime={this.changeTime}
                        changePage={this.changePage}
                        clickBtnGame={this.clickBtnGame}
                        changePerson={this.changePerson}
                        updatePickUser={this.updatePickUser}
                        getPickUser={this.getPickUser}
                        resetPickUser={this.resetPickUser}
                        getHasSkill={this.getHasSkill}
                        updatePickUserAtVote={this.updatePickUserAtVote}
                        getGamerData={this.getGamerData}
                        updatePickUserAtAgreeVote={
                          this.updatePickUserAtAgreeVote
                        }
                        killPickUser={this.killPickUser}
                        setVoteName={this.setVoteName}
                        setPlayFalse={this.setPlayFalse}
                        setPlayTrue={this.setPlayTrue}
                        setPickUserState={this.setPickUserState}
                      />
                    </div>
                  )}
                <div className="setting_box">
                  <div id="layout" className="bounds">
                    {localUser !== undefined &&
                      localUser.getStreamManager() !== undefined && (
                        <div
                          className="OT_root OT_publisher custom-class"
                          id="localUser"
                        >
                          <StreamComponent user={localUser} />
                          <ToolbarComponent
                            user={localUser}
                            camStatusChanged={this.camStatusChanged}
                            micStatusChanged={this.micStatusChanged}
                          />
                        </div>
                      )}
                  </div>
                  <div>
                    {this.props.waitData.roomChief ===
                      this.state.myUserName && (
                      <button className="start__btn" onClick={this.clickBtn}>
                        START
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.page === 1 && ( // ?????? ?????? ???????????????
          <div>
            {this.props.gamerData.job === "?????????" && <MafiaCard />}
            {this.props.gamerData.job === "??????????????????" && <CrazyCard />}
            {this.props.gamerData.job === "??????" && <PoliceCard />}
            {this.props.gamerData.job === "??????" && <DoctorCard />}
            {this.props.gamerData.job === "??????" && <MayorCard />}
            {this.props.gamerData.job === "??????" && <ReporterCard />}
            {this.props.gamerData.job === "????????????" && <NeutralCard />}
          </div>
        )}
        {this.state.page === 2 && ( // ??? ???????????????
          <DayToNightLoading
            page={this.state.page}
            checkGameTurn={this.checkGameTurn}
          />
        )}
        {/* ???????????? - ????????? ?????? x (??????, ????????????, ?????? ??? ??????) */}
        {this.state.page === 3 &&
          this.props.gamerData.isDead === false &&
          (this.props.gamerData.job === "??????" ||
            this.props.gamerData.job === "????????????" ||
            (this.props.gamerData.job === "??????" &&
              this.props.gamerData.hasSkill === false)) && (
            <div className="d-flex justify-content-between">
              <div className="mt-3">
                {this.props.gamerData.userList
                  .slice(0, 4)
                  .map((subGamer, i) => (
                    <div id="layout" className="ingame-bounds">
                      <div
                        key={i}
                        className="OT_root OT_publisher custom-class"
                        id="remoteUsers"
                      >
                        {subGamer.isDead === true ? (
                          <img src="images/deadOcto.jpg" width="200" />
                        ) : (
                          <img src="images/octoAtNight.png" width="200" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="d-flex flex-column justify-content-between">
                <div>
                  <NightOctopi />
                  <NightComponent />
                  <JobCardComponent gameJob={this.props.gamerData.job} />
                </div>
                <div className="d-flex justify-content-center">
                  <NightsStayIcon className="mini-moon" />
                  <h1 className="timer">{this.state.timer}</h1>
                </div>
                <div className="chating-box" style={chatDisplay}>
                  <ChatComponent
                    user={localUser}
                    chatDisplay={this.state.chatDisplay}
                    close={this.toggleChat}
                    settingListForSub={this.settingListForSub}
                    subscribers={this.state.subscribers}
                    canSend="false"
                    changeTime={this.changeTime}
                    changePage={this.changePage}
                    clickBtnGame={this.clickBtnGame}
                    changePerson={this.changePerson}
                    updatePickUser={this.updatePickUser}
                    getPickUser={this.getPickUser}
                    resetPickUser={this.resetPickUser}
                    getHasSkill={this.getHasSkill}
                    getGamerData={this.getGamerData}
                    updatePickUserAtAgreeVote={this.updatePickUserAtAgreeVote}
                    killPickUser={this.killPickUser}
                    setVoteName={this.setVoteName}
                    setPlayFalse={this.setPlayFalse}
                    setPlayTrue={this.setPlayTrue}
                    setPickUserState={this.setPickUserState}
                  />
                </div>
              </div>
              <div className="mt-3">
                {this.props.gamerData.userList
                  .slice(4, 8)
                  .map((subGamer, i) => (
                    <div id="layout" className="ingame-bounds">
                      <div
                        key={i}
                        className="OT_root OT_publisher custom-class"
                        id="remoteUsers"
                      >
                        {subGamer.isDead === true ? (
                          <img src="images/deadOcto.jpg" width="200" />
                        ) : (
                          <img src="images/octoAtNight.png" width="200" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        {/* ???????????? - ????????? ?????? o (?????????) */}
        {this.state.page === 3 &&
          this.props.gamerData.isDead === false &&
          this.props.gamerData.job === "?????????" && (
            <div className="d-flex justify-content-between">
              <div className="mt-3">
                {this.props.gamerData.userList
                  .slice(0, 4)
                  .map((subGamer, i) => (
                    <div
                      id="layout"
                      className={"ingame-bounds"}
                      onClick={(e) => this.selectPerson(subGamer, e)}
                    >
                      <div
                        key={i}
                        className={
                          subGamer.userName === this.state.pickUser
                            ? "OT_root OT_publisher custom-class ingame_picked_user"
                            : "OT_root OT_publisher custom-class"
                        }
                        id="remoteUsers"
                      >
                        {subGamer.isDead === true ? (
                          <img src="images/deadOcto.jpg" width="200" />
                        ) : subGamer.gameJob !== "?????????" ? (
                          <div className="octo-night-box">
                            <img src="images/octoAtNight.png" width="200" />
                            <p className="gamer-nickname">
                              {subGamer.userName}
                            </p>
                          </div>
                        ) : (
                          <StreamComponent
                            user={
                              subGamer.subIdx === undefined
                                ? localUser
                                : this.state.subscribers[subGamer.subIdx]
                            }
                          />
                        )}
                        {subGamer.userName === this.state.myUserName && (
                          <ToolbarComponent
                            user={localUser}
                            camStatusChanged={this.camStatusChanged}
                            micStatusChanged={this.micStatusChanged}
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="d-flex flex-column justify-content-between">
                <div>
                  <MafiaNightOctopi />
                  <NightComponent />
                  <JobCardComponent gameJob={this.props.gamerData.job} />
                </div>
                <div className="timer_bar">
                  <div className="d-flex justify-content-center night">
                    <NightsStayIcon className="mini-moon" />
                    <h1 className="timer">{this.state.timer}</h1>
                  </div>
                  <div className="mafiaButtons">
                    <p className="icons-property"></p>
                    {this.props.gamerData.minigameList[0] === true ? (
                      <button
                        onClick={this.clickFisherMiniGame}
                        className="mafiaEventBtn"
                      >
                        <img
                          src="icons/icons8-spinner-lure-50.png"
                          alt="lure event"
                        />
                      </button>
                    ) : (
                      <button className="usedEventBtn">
                        <img
                          src="icons/icons8-spinner-lure-50.png"
                          alt="lure event"
                        />
                      </button>
                    )}
                    {this.props.gamerData.minigameList[1] === true ? (
                      <button
                        onClick={this.clickSharkMiniGame}
                        className="mafiaEventBtn"
                      >
                        <img
                          src="icons/icons8-shark-50.png"
                          alt="shark event"
                        />
                      </button>
                    ) : (
                      <button className="usedEventBtn">
                        <img
                          src="icons/icons8-shark-50.png"
                          alt="shark event"
                        />
                      </button>
                    )}
                  </div>
                </div>

                <div className="chating-box" style={chatDisplay}>
                  <ChatComponent
                    user={localUser}
                    chatDisplay={this.state.chatDisplay}
                    close={this.toggleChat}
                    settingListForSub={this.settingListForSub}
                    subscribers={this.state.subscribers}
                    canSend="true"
                    changeTime={this.changeTime}
                    changePage={this.changePage}
                    clickBtnGame={this.clickBtnGame}
                    changePerson={this.changePerson}
                    updatePickUser={this.updatePickUser}
                    getPickUser={this.getPickUser}
                    resetPickUser={this.resetPickUser}
                    getHasSkill={this.getHasSkill}
                    updatePickUserAtVote={this.updatePickUserAtVote}
                    getGamerData={this.getGamerData}
                    updatePickUserAtAgreeVote={this.updatePickUserAtAgreeVote}
                    killPickUser={this.killPickUser}
                    setVoteName={this.setVoteName}
                    setPlayFalse={this.setPlayFalse}
                    setPlayTrue={this.setPlayTrue}
                    setPickUserState={this.setPickUserState}
                  />
                </div>
              </div>
              <div className="mt-3">
                {this.props.gamerData.userList
                  .slice(4, 8)
                  .map((subGamer, i) => (
                    <div
                      id="layout"
                      className={"ingame-bounds"}
                      onClick={(e) => this.selectPerson(subGamer, e)}
                    >
                      <div
                        key={i}
                        className={
                          subGamer.userName === this.state.pickUser
                            ? "OT_root OT_publisher custom-class ingame_picked_user"
                            : "OT_root OT_publisher custom-class"
                        }
                        id="remoteUsers"
                      >
                        {subGamer.isDead === true ? (
                          <img src="images/deadOcto.jpg" width="200" />
                        ) : subGamer.gameJob !== "?????????" ? (
                          <div className="octo-night-box">
                            <img src="images/octoAtNight.png" width="200" />
                            <p className="gamer-nickname">
                              {subGamer.userName}
                            </p>
                          </div>
                        ) : (
                          <StreamComponent
                            user={
                              subGamer.subIdx === undefined
                                ? localUser
                                : this.state.subscribers[subGamer.subIdx]
                            }
                          />
                        )}
                        {subGamer.userName === this.state.myUserName && (
                          <ToolbarComponent
                            user={localUser}
                            camStatusChanged={this.camStatusChanged}
                            micStatusChanged={this.micStatusChanged}
                          />
                        )}
                      </div>
                      <div>
                        <p>??????</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        {/* ???????????? - ????????? ?????? o ??????, ??????, ???????????? ?????? */}
        {this.state.page === 3 &&
          this.props.gamerData.isDead === false &&
          (this.props.gamerData.job === "??????" ||
            this.props.gamerData.job === "??????" ||
            this.props.gamerData.job === "??????????????????" ||
            (this.props.gamerData.job === "??????" &&
              this.props.gamerData.hasSkill === true)) && (
            <div className="d-flex justify-content-between">
              <div className="mt-3">
                {this.props.gamerData.userList
                  .slice(0, 4)
                  .map((subGamer, i) => (
                    <div
                      id="layout"
                      className="ingame-bounds"
                      onClick={(e) => this.selectVoteAtNight(subGamer, e)}
                    >
                      <div
                        key={i}
                        className={
                          subGamer.userName === this.state.pickUser
                            ? "OT_root OT_publisher custom-class ingame_picked_user"
                            : "OT_root OT_publisher custom-class"
                        }
                        id="remoteUsers"
                      >
                        {subGamer.isDead === true ? (
                          <img src="images/deadOcto.jpg" width="200" />
                        ) : subGamer.userName !==
                          this.props.gamerData.userName ? (
                          <div className="octo-night-box">
                            <img src="images/octoAtNight.png" width="200" />
                            <p className="gamer-nickname">
                              {subGamer.userName}
                            </p>
                          </div>
                        ) : (
                          <StreamComponent
                            user={
                              subGamer.subIdx === undefined
                                ? localUser
                                : this.state.subscribers[subGamer.subIdx]
                            }
                          />
                        )}
                        {subGamer.userName === this.state.myUserName && (
                          <ToolbarComponent
                            user={localUser}
                            camStatusChanged={this.camStatusChanged}
                            micStatusChanged={this.micStatusChanged}
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="d-flex flex-column justify-content-between">
                <div>
                  <NightOctopi />
                  <NightComponent />
                  <JobCardComponent gameJob={this.props.gamerData.job} />
                </div>
                <div>
                  {this.state.hasSkill === true &&
                    this.props.gamerData.job === "??????" && (
                      <div className="timer_bar">
                        <div className="d-flex justify-content-center night">
                          <NightsStayIcon className="mini-moon" />
                          <h1 className="timer">{this.state.timer}</h1>
                        </div>
                        <p className="reporter-skill-button">
                          <img src="icons/icons8-news-50.png" /> ?????? ?????? ??????
                          ??????{" "}
                        </p>
                      </div>
                    )}
                </div>
                {this.props.gamerData.job != "??????" && (
                  <div className="d-flex justify-content-center">
                    <NightsStayIcon className="mini-moon" />
                    <h1 className="timer">{this.state.timer}</h1>
                  </div>
                )}
                <div className="chating-box" style={chatDisplay}>
                  <ChatComponent
                    user={localUser}
                    chatDisplay={this.state.chatDisplay}
                    close={this.toggleChat}
                    settingListForSub={this.settingListForSub}
                    subscribers={this.state.subscribers}
                    canSend="false"
                    changeTime={this.changeTime}
                    changePage={this.changePage}
                    clickBtnGame={this.clickBtnGame}
                    changePerson={this.changePerson}
                    updatePickUser={this.updatePickUser}
                    getPickUser={this.getPickUser}
                    resetPickUser={this.resetPickUser}
                    getHasSkill={this.getHasSkill}
                    updatePickUserAtVote={this.updatePickUserAtVote}
                    getGamerData={this.getGamerData}
                    updatePickUserAtAgreeVote={this.updatePickUserAtAgreeVote}
                    killPickUser={this.killPickUser}
                    setVoteName={this.setVoteName}
                    setPlayFalse={this.setPlayFalse}
                    setPlayTrue={this.setPlayTrue}
                    setPickUserState={this.setPickUserState}
                  />
                </div>
              </div>
              <div className="mt-3">
                {this.props.gamerData.userList
                  .slice(4, 8)
                  .map((subGamer, i) => (
                    <div
                      id="layout"
                      className="ingame-bounds"
                      onClick={(e) => this.selectVoteAtNight(subGamer, e)}
                    >
                      <div
                        key={i}
                        className={
                          subGamer.userName === this.state.pickUser
                            ? "OT_root OT_publisher custom-class ingame_picked_user"
                            : "OT_root OT_publisher custom-class"
                        }
                        id="remoteUsers"
                      >
                        {subGamer.isDead === true ? (
                          <img src="images/deadOcto.jpg" width="200" />
                        ) : subGamer.userName !==
                          this.props.gamerData.userName ? (
                          <div className="octo-night-box">
                            <img src="images/octoAtNight.png" width="200" />
                            <p className="gamer-nickname">
                              {subGamer.userName}
                            </p>
                          </div>
                        ) : (
                          <StreamComponent
                            user={
                              subGamer.subIdx === undefined
                                ? localUser
                                : this.state.subscribers[subGamer.subIdx]
                            }
                          />
                        )}
                        {subGamer.userName === this.state.myUserName && (
                          <ToolbarComponent
                            user={localUser}
                            camStatusChanged={this.camStatusChanged}
                            micStatusChanged={this.micStatusChanged}
                          />
                        )}
                      </div>
                      <div>
                        <p>??????</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        {/* ???????????? - ????????? ?????? x (?????? ??????) */}
        {this.state.page === 3 && this.props.gamerData.isDead === true && (
          <div className="d-flex justify-content-between">
            <div className="mt-3">
              {this.props.gamerData.userList.slice(0, 4).map((subGamer, i) => (
                <div id="layout" className="ingame-bounds">
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <img src="images/octoAtNight.png" width="200" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex flex-column justify-content-between">
              <div>
                <NightOctopi />
                <NightComponent />
                <JobCardComponent gameJob={this.props.gamerData.job} />
              </div>
              <div className="d-flex justify-content-center">
                <NightsStayIcon className="mini-moon" />
                <h1 className="timer">{this.state.timer}</h1>
              </div>
              <div className="chating-box" style={chatDisplay}>
                <ChatComponent
                  user={localUser}
                  chatDisplay={this.state.chatDisplay}
                  close={this.toggleChat}
                  settingListForSub={this.settingListForSub}
                  subscribers={this.state.subscribers}
                  canSend="true"
                  changeTime={this.changeTime}
                  changePage={this.changePage}
                  clickBtnGame={this.clickBtnGame}
                  changePerson={this.changePerson}
                  updatePickUser={this.updatePickUser}
                  getPickUser={this.getPickUser}
                  resetPickUser={this.resetPickUser}
                  getHasSkill={this.getHasSkill}
                  updatePickUserAtVote={this.updatePickUserAtVote}
                  getGamerData={this.getGamerData}
                  updatePickUserAtAgreeVote={this.updatePickUserAtAgreeVote}
                  killPickUser={this.killPickUser}
                  setVoteName={this.setVoteName}
                  setPlayFalse={this.setPlayFalse}
                  setPlayTrue={this.setPlayTrue}
                  setPickUserState={this.setPickUserState}
                />
              </div>
            </div>
            <div className="mt-3">
              {this.props.gamerData.userList.slice(4, 8).map((subGamer, i) => (
                <div id="layout" className="ingame-bounds">
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <img src="images/octoAtNight.png" width="200" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ??? => ??? ???????????????
         */}
        {this.state.page === 7 && (
          <div className="day-to-night-sky">
            <NightToDayLoading setVictoryUser={this.setVictoryUser} />
          </div>
        )}
        {/* ?????? ??????
         */}
        {this.state.page === 8 && (
          <div className="night-result">
            <DeathResultComponent
              user={this.state.localUser}
              killed={this.state.killed}
            />
          </div>
        )}
        {/* ?????? ??????s
         */}
        {this.state.page === 9 && (
          <div className="report-result">
            <NewsResultComponent />
          </div>
        )}
        {/* ???
         */}
        {this.state.page === 10 && (
          <div className="d-flex justify-content-between">
            {/* <DayComponent /> */}
            <div className="mt-3">
              {this.props.gamerData.userList.slice(0, 4).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex flex-column justify-content-between">
              <div>
                <DayOctopi />
                <JobCardComponent gameJob={this.props.gamerData.job} />
              </div>
              <div className="d-flex justify-content-center">
                <Brightness7Icon className="mini-sun" />
                <h1 className="timer">{this.state.timer}</h1>
              </div>
              <div className="chating-box" style={chatDisplay}>
                <ChatComponent
                  user={localUser}
                  chatDisplay={this.state.chatDisplay}
                  close={this.toggleChat}
                  ref={this.ovref}
                  roomName={this.props.roomName}
                  settingListForSub={this.settingListForSub}
                  subscribers={this.state.subscribers}
                  canSend="true"
                  changeTime={this.changeTime}
                  changePage={this.changePage}
                  clickBtnGame={this.clickBtnGame}
                  changePerson={this.changePerson}
                  updatePickUser={this.updatePickUser}
                  getPickUser={this.getPickUser}
                  resetPickUser={this.resetPickUser}
                  getHasSkill={this.getHasSkill}
                  updatePickUserAtVote={this.updatePickUserAtVote}
                  getGamerData={this.getGamerData}
                  updatePickUserAtAgreeVote={this.updatePickUserAtAgreeVote}
                  killPickUser={this.killPickUser}
                  setVoteName={this.setVoteName}
                  setPlayFalse={this.setPlayFalse}
                  setPlayTrue={this.setPlayTrue}
                  setPickUserState={this.setPickUserState}
                />
              </div>
            </div>
            <div className="mt-3">
              {this.props.gamerData.userList.slice(4, 8).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i + 4] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ??????
         */}
        {this.state.page === 11 && (
          <div className="d-flex justify-content-between">
            <div className="mt-3">
              {this.props.gamerData.userList.slice(0, 4).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                  onClick={
                    this.props.gamerData.isDead === false
                      ? (e) => this.selectVote(subGamer, e)
                      : undefined
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class pick-for-vote"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                        picked={this.state.pickUser}
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex flex-column justify-content-between">
              <div>
                {/* {this.state.voteWaitPageStart === 1
                  ? <VoteWaitPage moveAgree={this.moveAgree} />
                  : <VotePage moveVoteWait={this.moveVoteWait} />
                } */}
                <DayOctopi />
                {/* <DayComponent /> */}
                <JobCardComponent gameJob={this.props.gamerData.job} />
              </div>
              <div className="d-flex justify-content-center">
                <HowToVoteIcon className="mini-vote" />
                <h1 className="timer">{this.state.timer}</h1>
              </div>
              <div className="chating-box" style={chatDisplay}>
                <ChatComponent
                  user={localUser}
                  chatDisplay={this.state.chatDisplay}
                  close={this.toggleChat}
                  ref={this.ovref}
                  roomName={this.props.roomName}
                  settingListForSub={this.settingListForSub}
                  subscribers={this.state.subscribers}
                  canSend="true"
                  changeTime={this.changeTime}
                  changePage={this.changePage}
                  clickBtnGame={this.clickBtnGame}
                  changePerson={this.changePerson}
                  updatePickUser={this.updatePickUser}
                  getPickUser={this.getPickUser}
                  resetPickUser={this.resetPickUser}
                  getHasSkill={this.getHasSkill}
                  updatePickUserAtVote={this.updatePickUserAtVote}
                  getGamerData={this.getGamerData}
                  updatePickUserAtAgreeVote={this.updatePickUserAtAgreeVote}
                  killPickUser={this.killPickUser}
                  setVoteName={this.setVoteName}
                  setPlayFalse={this.setPlayFalse}
                  setPlayTrue={this.setPlayTrue}
                  setPickUserState={this.setPickUserState}
                />
              </div>
            </div>
            <div className="mt-3">
              {this.props.gamerData.userList.slice(4, 8).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i + 4] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                  onClick={
                    this.props.gamerData.isDead === false
                      ? (e) => this.selectVote(subGamer, e)
                      : undefined
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class pick-for-vote"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                        picked={this.state.pickUser}
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                  <div>
                    <p>??????</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ?????? ?????? ???????????????
         */}
        {this.state.page === 12 && (
          <div>
            <VoteAnimationComponent />
          </div>
        )}
        {/* ?????? ?????? ???????????????
         */}
        {this.state.page === 16 && (
          <div>
            <VoteDoneAnimationComponent voteName={this.state.voteName} />
          </div>
        )}
        {/* ?????? ?????? + ??????????????? */}
        {this.state.page === 13 && (
          <div>
            <VoteAgreeComponent />
            <div className="d-flex justify-content-center">
              <div className="d-flex flex-column justify-content-between">
                <h1 className="timer">{this.state.timer}</h1>
                <div id="layout" className="voted-bounds">
                  {localUser !== undefined &&
                    localUser.getStreamManager() !== undefined && (
                      <div
                        className="OT_root OT_publisher custom-class"
                        id="localUser"
                      >
                        {this.props.gamerData.userList
                          .slice(0, 8)
                          .map((subGamer, i) => (
                            <div>
                              {subGamer.userName === this.state.pickUser ? (
                                <StreamComponent
                                  user={
                                    subGamer.subIdx === undefined
                                      ? localUser
                                      : this.state.subscribers[subGamer.subIdx]
                                  }
                                />
                              ) : (
                                <div className="agree-non-pickuser">
                                  <StreamComponent
                                    user={
                                      subGamer.subIdx === undefined
                                        ? localUser
                                        : this.state.subscribers[
                                            subGamer.subIdx
                                          ]
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
                {this.props.gamerData.isDead !== true && (
                  <div className="d-flex justify-content-around agree-box">
                    <div>
                      <input
                        type="radio"
                        id="agree_true"
                        value={true}
                        onChange={this.selectAgree}
                        checked={this.state.agree === true}
                        className="agree__btn"
                      />
                      <label htmlFor="agree_true">??????</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="agree_false"
                        value={false}
                        onChange={this.selectDisAgree}
                        checked={this.state.agree === false}
                        className="agree__btn"
                      />
                      <label htmlFor="agree_false">??????</label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ???????????? ?????? ???????????????
         */}
        {this.state.page === 17 && (
          <div>
            <VoteAnimationComponent />
          </div>
        )}
        {/* ???????????? ?????? ???????????????
         */}
        {this.state.page === 18 && (
          <div>
            <VoteDoneAnimationComponent voteName={this.state.voteName} />
          </div>
        )}
        {/* ?????? ???????????????
         */}
        {this.state.page === 14 && (
          <div className="d-flex justify-content-center">
            <div className="d-flex flex-column justify-content-between">
              <h1 className="timer">{this.state.timer}</h1>
              <div id="layout" className="voted-bounds">
                {localUser !== undefined &&
                  localUser.getStreamManager() !== undefined && (
                    <div
                      className="OT_root OT_publisher custom-class"
                      id="localUser"
                    >
                      {this.props.gamerData.userList
                        .slice(0, 8)
                        .map((subGamer, i) => (
                          <div>
                            {subGamer.userName === this.state.pickUser ? (
                              <StreamComponent
                                user={
                                  subGamer.subIdx === undefined
                                    ? localUser
                                    : this.state.subscribers[subGamer.subIdx]
                                }
                              />
                            ) : (
                              <div></div>
                            )}
                            {subGamer.userName === this.state.pickUser && (
                              <ExecutionPage
                                streamId={
                                  subGamer.subIdx === undefined
                                    ? localUser.streamManager.stream.streamId
                                    : this.state.subscribers[subGamer.subIdx]
                                        .streamManager.stream.streamId
                                }
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/*
          ?????? ????????????
        */}
        {this.state.page === 20 && (
          <div className="d-flex justify-content-between">
            <div>
              {this.props.gamerData.userList.slice(0, 4).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="d-flex flex-column justify-content-center align-items-center"
              style={{ width: "100%" }}
            >
              <SharkGameResult gameNum={this.state.gameNum} />
            </div>
            <div>
              {this.props.gamerData.userList.slice(4, 8).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i + 4] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ????????? ???????????? */}
        {this.state.page === 30 && (
          <div className="d-flex justify-content-between">
            <div>
              {this.props.gamerData.userList.slice(0, 4).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="d-flex flex-column justify-content-center align-items-center"
              style={{ width: "110%" }}
            >
              <FishingGame
                roomId={this.state.mySessionId}
                gameNum={this.state.gameNum}
              />
            </div>
            <div>
              {this.props.gamerData.userList.slice(4, 8).map((subGamer, i) => (
                <div
                  id="layout"
                  className={
                    this.state.speakingUsers[i + 4] && subGamer.isDead === false
                      ? "ingame-bounds-speaking"
                      : "ingame-bounds"
                  }
                >
                  <div
                    key={i}
                    className="OT_root OT_publisher custom-class"
                    id="remoteUsers"
                  >
                    {subGamer.isDead === true ? (
                      <img src="images/deadOcto.jpg" width="200" />
                    ) : (
                      <StreamComponent
                        user={
                          subGamer.subIdx === undefined
                            ? localUser
                            : this.state.subscribers[subGamer.subIdx]
                        }
                      />
                    )}
                    {subGamer.userName === this.state.myUserName && (
                      <ToolbarComponent
                        user={localUser}
                        camStatusChanged={this.camStatusChanged}
                        micStatusChanged={this.micStatusChanged}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/*
          ?????? ?????? ?????? 
        */}
        {this.state.page === 15 && (
          <div className="d-flex flex-column justify-content-center">
            {/* ????????? */}
            <div>
              <GameResultPage
                victoryUsers={this.state.victoryUsers}
                setFilter={this.setFilter}
                resetFilter={this.resetFilter}
              />
            </div>
            <div className="d-flex justify-content-around winner-box">
              {this.props.gamerData.userList
                .filter((sub) => this.state.victoryUsers.includes(sub.userName))
                .map((subGamer, i) => (
                  <div className="d-flex justify-content-center flex-column">
                    <FontAwesomeIcon
                      icon={faCrown}
                      className="crown winner-crown"
                    />
                    <div id="layout" className="winner-bounds">
                      {localUser !== undefined &&
                        localUser.getStreamManager() !== undefined && (
                          <div
                            key={i}
                            className="OT_root OT_publisher custom-class"
                            id="localUser"
                          >
                            <StreamComponent
                              user={
                                subGamer.subIdx === undefined
                                  ? localUser
                                  : this.state.subscribers[subGamer.subIdx]
                              }
                            />
                          </div>
                        )}
                    </div>
                    <p className="result-job-text">{subGamer.gameJob}</p>
                  </div>
                ))}
            </div>
            {/* ????????? */}
            <div className="d-flex justify-content-center">
              {this.props.gamerData.userList
                .filter(
                  (sub) =>
                    this.state.victoryUsers.includes(sub.userName) === false
                )
                .map((subGamer, i) => (
                  <div>
                    <div id="layout" className="loser-bounds col">
                      {localUser !== undefined &&
                        localUser.getStreamManager() !== undefined && (
                          <div
                            key={i}
                            className="OT_root OT_publisher custom-class"
                            id="localUser"
                          >
                            <StreamComponent
                              user={
                                subGamer.subIdx === undefined
                                  ? localUser
                                  : this.state.subscribers[subGamer.subIdx]
                              }
                            />
                            {subGamer.userName === this.state.myUserName && (
                              <ToolbarComponent
                                user={localUser}
                                camStatusChanged={this.camStatusChanged}
                                micStatusChanged={this.micStatusChanged}
                              />
                            )}
                          </div>
                        )}
                    </div>
                    <p className="result-job-text">{subGamer.gameJob}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /**
   * --------------------------
   * SERVER-SIDE RESPONSIBILITY
   * --------------------------
   * These methods retrieve the mandatory user token from OpenVidu Server.
   * This behaviour MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
   * the API REST, openvidu-java-client or openvidu-node-client):
   *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
   *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
   *   3) The token must be consumed in Session.connect() method
   */

  getToken() {
    return this.createSession(this.state.mySessionId).then((sessionId) =>
      this.createToken(sessionId)
    );
  }

  createSession(sessionId) {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({ customSessionId: sessionId });
      axios
        .post(this.OPENVIDU_SERVER_URL + "/openvidu/api/sessions", data, {
          headers: {
            Authorization:
              "Basic " + btoa("OPENVIDUAPP:" + this.OPENVIDU_SERVER_SECRET),
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          resolve(response.data.id);
        })
        .catch((response) => {
          var error = Object.assign({}, response);
          if (error.response && error.response.status === 409) {
            resolve(sessionId);
          } else {
            console.log(error);
            console.warn(
              "No connection to OpenVidu Server. This may be a certificate error at " +
                this.OPENVIDU_SERVER_URL
            );
            if (
              window.confirm(
                'No connection to OpenVidu Server. This may be a certificate error at "' +
                  this.OPENVIDU_SERVER_URL +
                  '"\n\nClick OK to navigate and accept it. ' +
                  'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                  this.OPENVIDU_SERVER_URL +
                  '"'
              )
            ) {
              window.location.assign(
                this.OPENVIDU_SERVER_URL + "/accept-certificate"
              );
            }
          }
        });
    });
  }

  createToken(sessionId) {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({
        kurentoOptions: {
          type: "WEBRTC",
          role: "PUBLISHER",
          allowedFilters: ["GStreamerFilter", "FaceOverlayFilter"],
        },
      });
      axios
        .post(
          this.OPENVIDU_SERVER_URL +
            "/openvidu/api/sessions/" +
            sessionId +
            "/connection",
          data,
          {
            headers: {
              Authorization:
                "Basic " + btoa("OPENVIDUAPP:" + this.OPENVIDU_SERVER_SECRET),
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  }
}

const mapStateToProps = (state) => ({
  userData: state.user,
  waitData: state.wait,
  gamerData: state.gamer,
});

const mapDispatchToProps = (dispatch) => {
  return {
    setUserListForSub: (data) => {
      dispatch(updateUserListforSub(data));
    },
    setLocalUser: (data) => {
      dispatch(setLocalUser(data));
    },
    setPickUser: (data) => {
      dispatch(setPickUser(data));
    },
    setHasntSkill: (data) => {
      dispatch(hasntSkill(data));
    },
    setShark: () => {
      dispatch(setShark());
    },
    setFisher: () => {
      dispatch(setFisher());
    },
    getMinigame: (data) => {
      dispatch(getMinigame(data));
    },
    setReporter: (data) => {
      dispatch(setReporter(data));
    },
    updateUserListforDead: (data) => {
      dispatch(updateUserListforDead(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true,
})(OpenViduComponent);
