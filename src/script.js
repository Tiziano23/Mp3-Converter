let forms = document.querySelectorAll('.convert-form');
let container = document.querySelector('.search-container');
let loader = document.querySelector('.loader-container');

forms.forEach(f => {
  f.querySelectorAll('input[type=file]').forEach(i => {
    i.addEventListener('change',() => {
      submitFormAjax(f);
    });
  });

  f.addEventListener('submit',e => {
    e.preventDefault();
    submitFormAjax(e.target);
    return false;
  });
});

function submitFormAjax(form){
  toggleLoaderVisibility();
  let formData = new FormData(form);
  let xhttp = new XMLHttpRequest();
  async function handleResponse(e){
    toggleLoaderVisibility();
    let res = JSON.parse(xhttp.response);
    window.open(res.url, '_blank');
    if(res.next != ''){
      for(let i = 0;i < res.next.length;i++){
        await new Promise(resolve => {
          let data = new FormData();
          data.append('video_url',res.next[i]);
          xhttp.open('POST','/convert-url');
          xhttp.onload = e => {
            window.open(JSON.parse(xhttp.response).url, '_blank');
            loader.querySelector('p').innerHTML='Downloaded files: '+(i+2)+'/'+(res.next.length+1);
            resolve();
          }
          xhttp.send(data);
        });
        xhttp.onload = handleResponse;
      }
    }
  };
  xhttp.onload = handleResponse;
  xhttp.open('POST',form.action);
  xhttp.send(formData);
}
function toggleLoaderVisibility(){
  if(loader.classList.contains('visible')){
    loader.querySelector('p').innerHTML = 'Done!';
    setTimeout(() => {
      loader.style.setProperty('animation','slide-out 1.5s ease-in-out reverse both');
      loader.classList.remove('visible');
      setTimeout(() => {
        loader.style.removeProperty('z-index');
      },750);
      setTimeout(() => {
        loader.style.removeProperty('animation');
      },1500);
    },2500);
  } else {
    loader.classList.add('visible');
    loader.querySelector('p').innerHTML = 'Converting';
    setTimeout(() => {
      loader.style.setProperty('z-index',3);
    },750);
  }
}
function lerp(a,b,p){
  if(typeof a == 'string' && typeof b == 'string'){
    a = a.replace('#','');
    b = b.replace('#','');
    let ar = parseInt(a.substring(0,2),16);
    let ag = parseInt(a.substring(2,4),16);
    let ab = parseInt(a.substring(4,6),16);

    let br = parseInt(b.substring(0,2),16);
    let bg = parseInt(b.substring(2,4),16);
    let bb = parseInt(b.substring(4,6),16);

    return `rgb(${lerp(ar,br,p)},${lerp(ag,bg,p)},${lerp(ab,bb,p)})`;
  } else {
    return a + (b-a)*p;
  }
}

/*let time = 0;
let dir = 1;
setInterval(() => {
  let perc = (time / 1000)**2;
  if(time >= 1000 || (time <= 0 && dir == -1))dir *= -1;
  time += 10 * dir;
  document.documentElement.style.setProperty('--accent-color',lerp('#05b1fb','#46e6da',perc));
  document.documentElement.style.setProperty('--background-color',lerp('#46e6da','#05b1fb',perc));
},10);*/
