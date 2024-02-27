const handleMemberJoin = async (MemberId) => {
    addMemberToDom(MemberId);
    let members = await channel.getMembers();
    updateMemberTotal(members);
    let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);

    await addBotMessageToDom(`Welcome to the room: ${name}`);
}

const handleMemberLeave = async (MemberId) => {
    removeMemberFromDom(MemberId);
    let members = await channel.getMembers();
    updateMemberTotal(members);
}

let addMemberToDom = async (MemberId) => {
    //go ahead and get the name attribute value that is in the key of member id
    let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);

    console.log(sessionStorage.getItem('display-name'));

    let memberWrapper = document.getElementById("member__list");

    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name == sessionStorage.getItem('display_name') ? `${name} (you)` : name}</p>
                    </div>`

    memberWrapper.insertAdjacentHTML('beforeend', memberItem);
}

let updateMemberTotal = async (members) => {
    let total = document.getElementById("members__count");
    total.innerText = members.length;
}

let removeMemberFromDom = async (MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
    let name = memberWrapper.getElementsByClassName('member_name')[0].textContent;
    addBotMessageToDom(`${name}! has left the room`);
    memberWrapper.remove();
}

let getMembers = async () => {
    let members = await channel.getMembers();
    updateMemberTotal(members);
    for (let i = 0; i < members.length; i++) {
        addMemberToDom(members[i]);
    }
}

//Texting
let handleChannelMessage = async (massageData, MemberId) => {
    console.log("cc");
    let msgData = JSON.parse(massageData.text);
    console.log(msgData);
    if (msgData.type === "chat") {
        addMessageToDom(msgData.displayName, msgData.message, "");
    }

    if (msgData.type === "user-left") {
        document.getElementById(`user-container-${msgData.uid}`).remove();
        if (userIdInDisplayFrame === `user-container-${msgData.uid}`) {
            displayFrame.style.display = 'none';
            const videoFrames = document.getElementsByClassName('video__container');
            for (let i = 0; videoFrames.length > i; i++) {
                videoFrames[i].classList.remove("shrink-video");
            }
        }
        let { name } = await rtmClient.getUserAttributesByKeys(uid, ['name']);
        addBotMessageToDom(`${name}! just unpublished.`);
    }
}

let sendMessage = async (e) => {
    e.preventDefault();

    let message = e.target.message.value;
    console.log(message);
    channel.sendMessage({ text: JSON.stringify({ 'type': 'chat', 'message': message, 'displayName': displayName }) });
    addMessageToDom(displayName, message, "owner");
    e.target.reset();
}

let addMessageToDom = (name, message, type) => {
    let messageWrapper = document.getElementById('messages');
    let newMessage = `<div class="message__wrapper">
                        <div class="message__body ${type == 'owner' ? 'right-message' : ''}" >
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div >
                    </div >`
    messageWrapper.insertAdjacentHTML("beforeend", newMessage);

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child');
    if (lastMessage) {
        lastMessage.scrollIntoView();
    }
}

//Bot
let addBotMessageToDom = (botMessage) => {
    let messageWrapper = document.getElementById('messages');
    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Jbee Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>`
    messageWrapper.insertAdjacentHTML("beforeend", newMessage);
    //Welcome to the room, Don't be shy, say hello!

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child');
    if (lastMessage) {
        lastMessage.scrollIntoView();
    }
}

let leaveChannel = async () => {
    await channel.leave();
    await rtmClient.logout();
}

window.addEventListener('beforeunload', leaveChannel);

let messageForm = document.getElementById('message__form');
messageForm.addEventListener('submit', sendMessage);
