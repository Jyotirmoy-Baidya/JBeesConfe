const APP_ID = "dc5db9f2725d40ecb386d4cd81a4baa7";

let uid = sessionStorage.getItem("uid");
if (!uid) {
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem("uid", uid);
    console.log(uid);
}

let ScreenUid = sessionStorage.getItem("ScreenUid");
if (!ScreenUid) {
    ScreenUid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem("ScreenUid", ScreenUid);
    console.log(ScreenUid);
}

let token = null;
let channel;
let client;
let ScreenClient;

let rtmClient;

//https://room.html/?room=345
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if (!roomId) {
    roomId = 'main';
}

let displayName = sessionStorage.getItem('display_name');
if (!displayName) {
    window.location = 'lobby.html';
}

let localTracks = [];
//to store the local audio and video streams
let remoteUsers = {}
//this will contain the key value pair of userId and audio and video tracks; 

let localScreenTracks;
let sharingScreen = false;

//User joining the room
let joinRoomInit = async () => {

    rtmClient = await AgoraRTM.createInstance(APP_ID);
    await rtmClient.login({ uid, token });

    //after login in we can add attributes  to our RTM User object
    await rtmClient.addOrUpdateLocalUserAttributes({ 'name': displayName });

    channel = await rtmClient.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', handleMemberJoin);
    channel.on("MemberLeft", handleMemberLeave);
    channel.on('ChannelMessage', handleChannelMessage);

    getMembers();
    addBotMessageToDom(`Welcome to the room, ${displayName} !`);

    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    //Client .join this method will join the client to the room
    await client.join(APP_ID, roomId, token, uid);

    //Whenever the remote users publishes the tracks  we get a callback here which returns the value of user who published in the channel and the media type it is providing
    client.on('user-published', handleUserPublish);
    client.on('user-left', handleUserLeft);

}

//join stream as an another presenter
let joinStream = async () => {

    document.getElementById('join-btn').style.display = "none";
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex';

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {
        // encoderConfig: {
        //     width: { min: 200, ideal: 1920, max: 1920 },
        //     height: { min: 200, ideal: 1080, max: 1080 }
        // }
    });


    //This fucntion amkes the local tracks ready to take tracks
    //This function also asks the device's permission to  access microphone and camera and will put the tracks received from deivces to the localtracks.
    //Here we can mention the dimensions pixel and quality. First one is of audio second is of  video

    let player = `<div class="video__container" id='user-container-${uid}'>
                        <div class="video-player" id="user-${uid}">
                        </div>
                    </div>`

    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);


    //Audio track is stored in index 0 and video track is stored in index 1
    localTracks[1].play(`user-${uid}`);
    //this play method puts a video tag over there and plays the video in the mention tag with the given id
    //The play() method is a part of the Web Audio API and the HTMLMediaElement interface in web development. It is used to start playback of a media element, such as an audio or video file. If you have a web page with an audio element, you can use the play() method to begin playback.


    //Now we need to publish the local tracks to the channel
    await client.publish([localTracks[0], localTracks[1]]);

    //First the audio track and then the video track it will trigger the user published event listener and handle user publish will be called


}


//This will publish the  local tracks to the channel so that other users can  see it
const handleUserPublish = async (user, mediaType) => {

    remoteUsers[user.uid] = user;
    //this saves the users data in the user.uid key

    //this client i.e. local user get the subscription of the remote user
    await client.subscribe(user, mediaType);

    //To prevent the same user publishing to make two different video__container as the user will continuosly copy pasting the same data
    let player = document.getElementById(`user-container-${user.uid}`);


    if (player === null) {
        player = `<div class="video__container" id='user-container-${user.uid}'>
        <div class="video-player" id="user-${user.uid}">
        </div>
        </div>`
        document.getElementById("streams__container").insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame);
    }

    if (displayFrame.style.display) {
        player.style.height = '100px';
        player.style.width = '100px';
    }


    if (mediaType === 'video') {
        user.videoTrack.play(`user-${user.uid}`);
    }
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();

    if (userIdInDisplayFrame == `user-container-${user.uid}`) {
        displayFrame.style.display = 'none';
        // displayFrame.style.display = 'null';
        const videoFrames = document.getElementsByClassName('video__container');
        for (let i = 0; videoFrames.length > i; i++) {
            videoFrames[i].classList.remove("shrink-video");
        }

    }

}


let toggleCamera = async (e) => {
    let button = e.currentTarget;

    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        button.classList.add('active');
    }
    else {
        await localTracks[1].setMuted(true);
        button.classList.remove('active');
    }
}

let toggleMic = async (e) => {
    let button = e.currentTarget;

    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        button.classList.add('active');
    }
    else {
        await localTracks[0].setMuted(true);
        button.classList.remove('active');
    }
}

let toggleScreen = async (e) => {
    let button = e.currentTarget;
    let cameraBtn = document.getElementById('camera-btn');

    if (!sharingScreen) {
        sharingScreen = true;

        button.classList.add("active");
        localScreenTracks = await AgoraRTC.createScreenVideoTrack();
        ScreenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        await ScreenClient.join(APP_ID, roomId, token, ScreenUid);

        if (userIdInDisplayFrame) {
            let child = displayFrame.children[0];
            child.classList.add('shrink-video');
            if (child) {
                document.getElementById('streams__container').appendChild(child);
            }
        }

        displayFrame.style.display = 'block';
        let player = `<div class="video__container" id='user-container-${ScreenUid}'>
        <div class="video-player" id="user-${ScreenUid}">
        </div>
        </div>`
        displayFrame.insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${ScreenUid}`).addEventListener('click', expandVideoFrame);

        userIdInDisplayFrame = `user-container-${ScreenUid}`

        localScreenTracks.play(`user-${ScreenUid}`);

        // await client.unpublish(localTracks[1]);
        await ScreenClient.publish([localScreenTracks]);

        let videoFrames = document.getElementsByClassName('video__container');
        for (let i = 0; i < videoFrames.length; i++) {
            if (videoFrames[i].id != userIdInDisplayFrame) {
                videoFrames[i].classList.add("shrink-video");
            }
        }

    }

    else {
        sharingScreen = false;
        button.classList.remove('active');
        await ScreenClient.unpublish([localScreenTracks]);
        let player = "";

        let child = displayFrame.children[0];
        if (child.id === `user-container-${ScreenUid}`) {
            displayFrame.style.display = null;
            // document.getElementById('streams__container').appendChild(child);
            const videoFrames = document.getElementsByClassName('video__container');
            for (let i = 0; videoFrames.length > i; i++) {
                videoFrames[i].classList.remove("shrink-video");
            }
        }
        document.getElementById(`user-container-${ScreenUid}`).remove();
        userIdInDisplayFrame = 'null';
        ScreenClient.leave();
    }

}


let leaveStream = async (e) => {
    e.preventDefault();
    document.getElementById('join-btn').style.display = "block";
    document.getElementsByClassName('stream__actions')[0].style.display = 'none';
    for (let i = 0; i < localTracks.length; ++i) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.unpublish([localTracks[0], localTracks[1]]);
    if (localScreenTracks) {
        localScreenTracks.stop();
        localScreenTracks.close();
        await ScreenClient.unpublish([localScreenTracks]);
    }

    document.getElementById(`user-container-${uid}`).remove();

    if (userIdInDisplayFrame === `user-container-${uid}`) {
        displayFrame.style.display = 'none';
        const videoFrames = document.getElementsByClassName('video__container');
        for (let i = 0; videoFrames.length > i; i++) {
            videoFrames[i].classList.remove("shrink-video");
        }

    }

    channel.sendMessage({ text: JSON.stringify({ 'type': 'user-left', 'uid': uid }) });



}


document.getElementById('mic-btn').addEventListener('click', toggleMic);

document.getElementById('screen-btn').addEventListener('click', toggleScreen);

document.getElementById('camera-btn').addEventListener('click', toggleCamera);

document.getElementById('join-btn').addEventListener('click', joinStream);

document.getElementById('leave-btn').addEventListener('click', leaveStream);

joinRoomInit();
//As the user joins the room this function triggers