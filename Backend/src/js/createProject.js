// On page load create event listeners
const projectForm = document.getElementById("createproject");

function toUnixTimestamp (date,time)
{
    // Your date string
    const dateString = `${date} ${time}`

    // Create a Date object
    const date_ = new Date(dateString);

    // Convert to Unix timestamp (in seconds)
    const unixTimestamp = Math.floor(date_.getTime()/1000);

    return unixTimestamp;
}

/** asynchronously add event listeners on page load */
$(async () => {
    $('#home').click(()=>{
        window.location.href = "/projects";
    });
    // Create input listener for uploading project image
    $("#fileUpload").on("input", (event) => {
        updatePreviewImage(event);
    });
    $("#imageurl").on("input", (event) => {
        updatePreviewImage(event)
    });

    // Create key listener for project name
    $("#name").on("keyup", () => {
        updatePreviewName();
    });

    // Create key listener for project description
    $("#description").on("keyup", () => {
        updatePreviewDescription();
    });

    // Create input listener for project time
    $("#time").on("input", () => {
        updatePreviewDateTime();
    });

    // Create input listener for project date
    $("#date").on("input", () => {
        updatePreviewDateTime();
    });

    // Create input listener for project location
    $("#locations").on("input", () => {
        updatePreviewLocation();
    });

    // Create input listener for peopleRequired
    $("#peopleRequired").on("input", () => {
        updatePeopleRequired();
    });
    $("#removeImage").on("click", () => {
        $("#preview").attr("src", "").hide();
        $('#imageurl').val('');
        $('.upload-label').show(); // Show the "Upload" text if no image
        $("#removeImage").hide();
        $("#uploadstatus").html("");
    })
    // Load skill list
    await loadSkillList();

    // Create keyup listener for skill search bar
    const searchBar = $("#searchskills");
    searchBar.on("input", () => {
        manageDisplayedSkills(searchBar.val());
    });
});

/**
 * Updates the image of the preview display in realtime
 */
const updatePreviewImage = (event) => {
    // Check if there is an image in the upload list
    const images = event.target.files;
    let image = "";
    if(event.currentTarget === $("#imageurl")[0]){
        image = $("#imageurl").val();
    }else{
        if (images.length < 0){
            return;
        }else{
            image = URL.createObjectURL(images[0]);
        }
    }
    const previewElement = $(".projectlist img");
    previewElement.attr("src", image);
    $('#preview').attr('src', image).show();
    $('.upload-label').hide(); // Hide the "Upload" text
    $('#removeImage').show(); // Show the "Remove" button
    // Create status message
    const status = $("#uploadstatus");
    status.html("Upload Successful!");
    status.css({
        "color": "green",
        "font-size": "small",
    });
}

/**
 * Updates the title of the preview display in realtime
 */
const updatePreviewName = () => {
    const titleContent = $("#name").val();
    const previewElement = $("article h1");

    if (titleContent.length < 1)
        previewElement.text("My Project");
    else
        previewElement.text(titleContent)
}

/**
 * Updates the description of the preview in realtime
 */
const updatePreviewDescription = () => {
    const descriptionContent = $("#description").val();
    const previewElement = $("p.description");

    if (descriptionContent.length < 1)
        previewElement.html("Give a detailed explanation of your project");
    else
        previewElement.html(descriptionContent);
}

/**
 * Updates the meetup time of the preview in realtime (the regex is ugly, and I'm sorry) <-- its not that bad anymore
 */
const updatePreviewDateTime = () => {
    const previewElement = $(".projectlist .meettime");

    // Number to text month object
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    // Gather time data
    const timeContent = $("#time").val();
    if (timeContent) {
        let timeSuffix = "AM";
        let hour = parseInt(timeContent.split(":")[0]);
        let minutes = timeContent.split(":")[1];

        // account for 24 hour time
        if (hour > 12)
        {
            hour -= 12;
            timeSuffix = "PM";
        }

        const timeResult = `${hour}:${minutes} ${timeSuffix}`;

        // Update preview element
        previewElement.html(previewElement.html().replace(/(Meetup Time:\s)(.+)/g, `$1${timeResult}`));
    }

    // Gather date data
    const dateContent = $("#date").val();
    if (dateContent)
    {
        const year = parseInt(dateContent.split("-")[0]);
        const month = parseInt(dateContent.split("-")[1]);
        const day = parseInt(dateContent.split("-")[2]);

        const dateResult = `${months[month-1]} ${day}, ${year}`;

        // Update preview element
        previewElement.html(previewElement.html().replace(/(Meetup Time:\s)(.+)/g, `$1${dateResult} at $2`));
    }
}

/**
 * Updates the location of the preview in realtime
 */
const updatePreviewLocation = () => {
    const locationContent = $("#locations").val();
    const previewElement = $(".projectlist .meetlocation");

    if (locationContent.length > 1)
        previewElement.html(previewElement.html().replace(/(Location:\s)(.+)/g, `$1${locationContent}`));
    else
        previewElement.html(previewElement.html().replace(/(Location:\s)(.+)/g, "$1x"));
}

/**
 * Updates the location of the preview in realtime
 */
const updatePeopleRequired = () => {
    const peopleRequired = $("#peopleRequired").val();
    const previewElement = $(".peopleSlash");

    /** when selecting by class, we get an array back so we index for the `p` */
    previewElement[0].innerHTML = "/" + peopleRequired;
}

/**
 * Loads the general index of skills from skills.json
 */
const loadSkillList = async () => {
    let skills = {};
    await $.ajax({
        url: "/v1/getSkills",
        type: "GET",
        success: function(response, textStatus, xhr) {
            skills = Object.values(response.data);
        },
        error: function(xhr, status, error) {
            console.log("this is bad. very bad");
        }
    });

    // Add all skills to the proper container
    const container = $("#selectskills");
    skills.forEach((skill) => {
        createSkillElement(container, skill, false);
    });
}

/**
 * Creates a skill element in a given container
 * @param {object}container Where to put the skill
 * @param {object}skill What the skill is in format {skillName: "name", skillType: "type"}
 * @param {boolean}isPreview Whether the skill is being appended to the preview view or not
 */
const createSkillElement = (container, skill, isPreview) => {
    const newSkill = $("<div>");
    const newSkillIcon = $("<p>");
    const newSkillName = $("<p>");
    // Add event listener to skills only if it is NOT a preview item
    if (!isPreview) {
        newSkill.click(() => {
            // If the skill exists in the project, remove it
            if (newSkill.hasClass("selected")) {
                newSkill.removeClass("selected");
                removeSkillElement(skill.skillName);
            } else { // Otherwise, add it
                newSkill.addClass("selected");
                const previewContainer = $(".projectlist .skills");
                createSkillElement(previewContainer, skill, true)
            }
        });
    }


    // Add proper classes and content
    newSkill.addClass(`skill ${skill.skillType}`);

    newSkillIcon.addClass("skillicon");
    newSkillIcon.text("•");

    newSkillName.addClass("skillname");
    newSkillName.text(skill.skillName);

    // Create element hierarchy
    newSkill.append(newSkillIcon);
    newSkill.append(newSkillName);
    container.append(newSkill);
}

/**
 * Removes a skill element from the preview based on the name of the skill
 * @param {string}skillName Name of skill
 */
const removeSkillElement = (skillName) => {
    const skills = $(".projectlist .skills").children();
    skills.each((index, skill) => {
        if ($(skill).find(".skillname").html() === skillName) skills.eq(index).remove();
    })
}

function createSkill() {
    let skillName = window.prompt("Enter skill name here:");
    if (skillName !== null) {
        let skillType = window.prompt("Enter \"cs\" for Computer Science, \"business\" for Business, and \"engr\" for Engineering:");
        if (skillType !== null) {
            API.createSkill(skillName, skillType);
            createSkillElement($("#selectskills"), {skillName: skillName, skillType: skillType}, false);
        }
    }
}

function validateObject(sendObj) {
    let outObj ={
        "status":true,
        "response":"",
    }
    for (const key in sendObj) {
        if (sendObj.hasOwnProperty(key)) {
            if (sendObj[key] === "") {
                outObj["response"] = `Missing ${key}`
                outObj["status"] = false;
                return outObj; // A null value is found
            }

            // Special handling for the nested 'Meetup' object
            if (key === "Meetup") {
                for (const meetupKey in sendObj.Meetup) {
                    if (sendObj.Meetup.hasOwnProperty(meetupKey)) {
                        if (sendObj.Meetup[meetupKey] === null) {
                            outObj["response"] = `Missing ${key}`
                            outObj["status"] = false;
                            return outObj; // A null value is found in the nested object
                        }
                    }
                }
            }
        }
    }

    // Special handling for the 'Skills Desired' array
    if (Array.isArray(sendObj["Skills Desired"])) {
        if (sendObj["Skills Desired"].length === 0 || sendObj["Skills Desired"].includes(null)) {
            outObj["response"] = `Missing Skills Desired`;
            outObj["status"] = false;
            return outObj; // The array is empty or contains null
        }
    } else {
        outObj["response"] = `Missing Skills Desired`;
        outObj["status"] = false;
        return outObj; // 'Skills Desired' is not an array
    }
    outObj["status"] = true;
    return outObj; // All checks passed
}


function getSkillNamesArray() {
    // Initialize an array to hold the skill names
    var skillNames = [];
    // Use jQuery to select each .skillname element and iterate over them
    $('#selectskills .selected .skillname').each(function() {
      // Add the innerHTML (text content) of each .skillname element to the array
      skillNames.push($(this).text());
    });
  
    return skillNames;
  }
  
  function setLoader(){
    $('#formSubmitResponse').html("");
    $('#formSubmitResponse').addClass("loader");
  }
  async function setResponse(text, color){
    await delay(250);
    $('#formSubmitResponse').removeClass("loader");
    $('#formSubmitResponse').html(`${text}`).css("color",color);
    setTimeout(()=>{
        $(this).html("");
     },1500)
}

function getBase64FromImage() {
    // Assuming the image has an id="preview"
    var imageData = $('#preview').attr('src');
    if (imageData) {
        if(imageData.startsWith("https://")){
            return imageData;
        }
        // Optional: Check if it's indeed base64 data
        if (imageData.indexOf('data:image') === 0) {
            // Image data is in base64 format
            return imageData.split(',')[1]; // Split by comma and take the second part, which is the base64 data
        } else {
            console.log('The image src does not contain base64 data.');
            return null;
        }
    } else {
        console.log('No image found.');
        return null;
    }
}


const fileToDataURL = async(file) =>{
    let reader = new FileReader();
    return new Promise(function (resolve, reject) {
      reader.onload = function (event) {
        let base64DataUrl = event.target.result;
        let base64String = base64DataUrl.split(',')[1];
        resolve(base64String);
      }
      reader.readAsDataURL(file)
    })
  }  


projectForm.addEventListener("submit",async (event)=>{
    event.preventDefault();
    setLoader();
    const form = new FormData(projectForm);
    const obj = Object.fromEntries(form.entries());
    let date = toUnixTimestamp(obj["date"],obj["time"]);
    const file = document.getElementById("fileUpload").files[0];
    let imageBase64 = "";
    if(!file){
        imageBase64 = getBase64FromImage();
        if(!imageBase64){
            setResponse("No image selected","red");
            return;
        }
    }else{
        try {
            imageBase64 = await fileToDataURL(file);
        } catch (e) {
            setResponse("Please upload an image file to your project!", "red");
            return;
        }    
    }
    let sendObj = {
        "Name":obj["name"],
        "Description":obj["description"],
        "Meetup":{
            "Time":date,
            "Location":obj["location"]
        },        
        "Skills Desired":getSkillNamesArray(),
        "CoverImage":imageBase64,
        "PeopleRequired":$('#peopleRequired').val()
    }
    let validObject = validateObject(sendObj);
    if(!validObject.status){
        setResponse(validObject.response,"red");
        return;
    }
    API.createProject(sendObj).then(async data=>{
        if(data.status){
            setResponse(data.response,"green")
        }else{
            setResponse(data.response,"green")
        }

        await delay(1000);
        console.log(data);
        window.location.href = `/manageProject?id=${data.data.ID}`;

    }).catch(err=>{
        console.log(err);
        setResponse("Network Error","Red")

    });

});
