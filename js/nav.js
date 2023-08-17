"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
  loadFavs();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

function navSubmitClick(){
  $submitForm.toggleClass('hidden');
}

$navSubmit.on('click', navSubmitClick);

function navFavoritesClick(){
  if(!(currentUser.favorites.length > 0)){
    $allStoriesList.empty();
    $allStoriesList.append('<p>No Favorites Yet!</p>');
    return;
  }
  $allStoriesList.empty();
  for (let story of currentUser.favorites){
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  loadFavs();
}

$('#nav-favorites').on('click', navFavoritesClick);

async function navMyStoriesClick(){
  if(!(currentUser.ownStories.length > 0)){
    $allStoriesList.empty();
    $allStoriesList.append('<p>No User Stories Yet!</p>');
    return;
  }
  $allStoriesList.empty();
  for (let story of currentUser.ownStories){
    const $story = generateMyStoryMarkup(story);
    $story.on('click', ".trashcan", await trashClick);
    $allStoriesList.append($story);
  }
  loadFavs();

}

function generateMyStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <span class="edit">
          <i class="far fa-edit"></i>
        </span>
        <span class="trashcan">
          <i class="fas fa-trash-alt"></i>
        </span>
        <span class="star">
          <i class="fa-star far">
          </i>
        </span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}


$('#nav-mystories').on('click', navMyStoriesClick);

async function trashClick(evt){
  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);  
  
  await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/stories/${storyId}`, {params:{token: currentUser.loginToken}});
  $closestLi.remove();

  let curUser = await axios.get(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}`, {params:{token: currentUser.loginToken}});
  console.log(curUser);
  let temp = [];
  for(let stry of curUser.data.user.stories){
    temp.push(new Story(stry));
  }
  currentUser.ownStories = temp;
  storyList = await StoryList.getStories();
}

$('#nav-user-profile').on('click', async function(){
  loadUserInfo();

  $('#username-edit').on('click', async function(evt){
    const $tgt = $(evt.target);
    const $closestLi = $tgt.closest("li");

    $closestLi.append($(`<form id="username-form">
    <hr>
    <label for="edit-username">username</label>
    <input id="edit-username" required placeholder="enter new username">
    <button type="submit">submit</button>
    </form>
    `));
    $('#username-form').on('submit', await userNameEdit);
  });

  $('#password-edit').on('click', async function(evt){
    const $tgt = $(evt.target);
    const $closestLi = $tgt.closest("li");

    $closestLi.append($(`<form id="password-form">
    <hr>
    <label for="edit-password">password</label>
    <input id="edit-password" required placeholder="enter new password">
    <button type="submit">submit</button>
    </form>
    `));
    $('#password-form').on('submit', await passwordEdit);
  });


});

function loadUserInfo(){
  $allStoriesList.empty();
  $allStoriesList.append($(`<div>
  <h3>User Info</h3>
  <ol id="user-info">
  <li><p><b>name: </b>${currentUser.name}</p></li>
  <li><p><span class="info-edit" id="username-edit"><i class="far fa-edit"></i></span><b>username: </b>${currentUser.username}</p></li>
  <li><p><span class="info-edit" id="password-edit"><i class="far fa-edit"></i></span><b>password: </b>******</p></li>
  <li><p><b>created at: </b>${currentUser.createdAt}</p></li>
  </ol>
  </div>
  `));
}

async function userNameEdit(){
  let newUserName = $('#edit-username').val();
  // let curUser = await axios.get(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}`, {params:{token: currentUser.loginToken}});

  let newUser = await axios.patch(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}`, {"token": currentUser.loginToken,
"user":{"username": newUserName}
});

localStorage.username = newUserName;
location.reload();
  
}

async function passwordEdit(){
  let newPassword = $('#edit-password').val();
  // let curUser = await axios.get(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}`, {params:{token: currentUser.loginToken}});

  let newUser = await axios.patch(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}`, {"token": currentUser.loginToken,
"user":{"password": newPassword}
});
location.reload();
  
}



