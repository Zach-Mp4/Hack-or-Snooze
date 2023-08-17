"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;
/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
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
      <hr>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");
  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }


  $allStoriesList.show();
}

async function submitAction(){
  try{
    if(currentUser == null){
      throw new Error('NOT LOGGED IN');
    }
  const author = $("#create-author").val();
  const title = $("#create-title").val();
  const url = $("#create-url").val();

  let newStory = await storyList.addStory(currentUser, {title, author, url});
  console.log(newStory);
  storyList = await StoryList.getStories();
  putStoriesOnPage();
  $submitForm.toggleClass('hidden');
  currentUser.ownStories.push(new Story(newStory));

  $("#create-author").val('');
  $("#create-title").val('');
  $("#create-url").val('');
  }
  catch{
    $submitForm.prepend($('<p class="red">NOT LOGGED IN!</P>'));
  }
}

$submitForm.on('submit', submitAction);

async function toggleStoryFavorite(evt) {
  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($tgt.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);

async function edit(evt){
  if($('#edit-form').length !== 1){
    const $tgt = $(evt.target);
    const $closestLi = $tgt.closest("li");
    const storyId = $closestLi.attr("id");
    const story = storyList.stories.find(s => s.storyId === storyId);  
    $closestLi.append(generateForm());

    $("#edit-form").on('submit', async function(evt){
      const author = $("#edit-author").val();
      const title = $("#edit-title").val();
      const url = $("#edit-url").val();

      let newStory = await axios.patch(`https://hack-or-snooze-v3.herokuapp.com/stories/${storyId}`, {
        "token": currentUser.loginToken,
        "story": {
          "author": author,
          "title": title,
          "url": url
        }
      });

      let editedStory = new Story({
        storyId: newStory.data.story.storyId,
        title: newStory.data.story.title,
        author: newStory.data.story.author,
        url: newStory.data.story.url,
        username: newStory.data.story.username,
        createdAt: newStory.data.story.updatedAt
      });
      // console.log(storyList.stories[storyList.stories.indexOf(story)]);
      // storyList.stories[storyList.stories.indexOf(story)] = editedStory;
      // console.log(editedStory);

      // currentUser.ownStories[currentUser.ownStories.indexOf(story)] = editedStory;
      let curUser = await axios.get(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}`, {params:{token: currentUser.loginToken}});
      console.log(curUser);
      let temp = [];
      for(let stry of curUser.data.user.stories){
        temp.push(new Story(stry));
      }
      currentUser.ownStories = temp;
      storyList = await StoryList.getStories();
      navMyStoriesClick();
    });
  }
}

function generateForm(){
  return $(`<form id="edit-form">
  <hr>
  <div>
      <label for="edit-author">author</label>
      <input id="edit-author" required placeholder="author name">
    </div>
    <div>
      <label for="edit-title">title</label>
      <input id="edit-title" required placeholder="story title">
    </div>
    <div>
      <label for="edit-url">url</label>
      <input id="edit-url" required type="url" placeholder="story url">
    </div>
    <button type="submit" id="edit-submit">submit</button>
  </form>`);
}

$allStoriesList.on("click", ".edit", edit);





