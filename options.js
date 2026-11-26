const form=document.getElementById("settingsForm"),status=document.getElementById("saveStatus");
chrome.storage.sync.get({googleApiKey:"",googleCx:""}).then(s=>{document.getElementById("googleApiKey").value=s.googleApiKey;document.getElementById("googleCx").value=s.googleCx});
form.addEventListener("submit",async e=>{e.preventDefault();await chrome.storage.sync.set({googleApiKey:document.getElementById("googleApiKey").value.trim(),googleCx:document.getElementById("googleCx").value.trim()});status.textContent="ההגדרות נשמרו במכשיר."});
