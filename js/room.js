let messagesContainer = document.getElementById('messages');

//This scrolls the chat section to the reach the lowest point of the container
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const membkerContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;


//Opens and closes the member section
memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});

let displayFrame = document.getElementById('stream__box');
const videoFrames = document.getElementsByClassName('video__container');
let userIdInDisplayFrame = null;
// which user clicked the frame 

let expandVideoFrame = (e) => {

  let child = displayFrame.children[0];
  if (child) {
    document.getElementById('streams__container').appendChild(child); // move stream to streams container 
  }

  displayFrame.style.display = 'block';

  displayFrame.appendChild(e.currentTarget);
  userIdInDisplayFrame = e.currentTarget.id;

  for (let i = 0; videoFrames.length > i; i++) {
    if (videoFrames[i].id != userIdInDisplayFrame) {
      videoFrames[i].classList.add("shrink-video");
    }
  }

}

let hideVideoFrame = () => {
  userIdInDisplayFrame = null;
  displayFrame.style.display = null;

  let child = displayFrame.children[0];
  if (child) {
    document.getElementById('streams__container').appendChild(child);
    const videoFrames = document.getElementsByClassName('video__container');
    for (let i = 0; videoFrames.length > i; i++) {
      videoFrames[i].classList.remove("shrink-video");
    }
  }
}



for (let i = 0; videoFrames.length > i; i++) {
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

displayFrame.addEventListener('click', hideVideoFrame);
