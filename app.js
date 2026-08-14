var API="https://netease-cloud-music-api-nu-sepia-68859l454r.vercel.app";
var PL=[];
var playlist=PL.slice(),ci=-1,playing=false,elapsed=0,timerRef=null;
var au=new Audio();au.preload="metadata";au.crossOrigin="anonymous";
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function fmt(s){if(!isFinite(s)||s<0)s=0;s=Math.floor(s);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function setupAv(iid,lid,key){var inp=$(iid),lt=$(lid),sv=localStorage.getItem(key);if(sv){var im=document.createElement("img");im.src=sv;lt.replaceWith(im);}inp.addEventListener("change",function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){localStorage.setItem(key,ev.target.result);var bx=inp.parentElement,ol=bx.querySelector("img")||bx.querySelector(".letter");if(ol){var im=document.createElement("img");im.src=ev.target.result;ol.replaceWith(im);}};r.readAsDataURL(f);});}
setupAv("uploadL","letterL","avatar_left");setupAv("uploadR","letterR","avatar_right");
function startTimer(){if(timerRef)return;timerRef=setInterval(function(){elapsed++;showTimer();},1000);}
function stopTimer(){if(timerRef){clearInterval(timerRef);timerRef=null;}}
function showTimer(){var h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;var t="一起听了 ";if(h>0)t+=h+"小时";if(m>0)t+=m+"分钟";if(h===0&&m===0)t+=s+"秒";$("timeText").textContent=t;}
function avatarsTogether(){$("avatarLeft").classList.add("together");$("avatarRight").classList.add("together");$("wireL").classList.add("show");$("wireR").classList.add("show");$("statusText").textContent="TA就在你身边";startTimer();}
function avatarsApart(){$("avatarLeft").classList.remove("together");$("avatarRight").classList.remove("together");$("wireL").classList.remove("show");$("wireR").classList.remove("show");$("statusText").textContent="暂停中";stopTimer();}
function renderPL(){var l=$("songList");l.innerHTML="";playlist.forEach(function(s,i){var d=document.createElement("div");d.className="song-item"+(i===ci?" playing":"");d.innerHTML='<span class="song-idx">'+(i===ci?"&#9835;":i+1)+'</span><div class="song-meta"><div class="sname">'+esc(s.title)+'</div><div class="sartist">'+esc(s.artist||"")+'</div></div>';d.onclick=function(){selSong(i);};l.appendChild(d);});}

/* ---- 网易云：获取歌曲播放链接 ---- */
function getSongUrl(id,cb){
  fetch(API+"/song/url/v1?id="+id+"&level=exhigh").then(function(r){return r.json();}).then(function(j){
    var u=(j.data&&j.data[0]&&j.data[0].url)||"";
    cb(u);
  }).catch(function(){cb("");});
}

/* ---- 网易云：获取歌词 ---- */
function getLyric(id,cb){
  fetch(API+"/lyric?id="+id).then(function(r){return r.json();}).then(function(j){
    var raw=(j.lrc&&j.lrc.lyric)||"";
    var lines=[];
    raw.split("\n").forEach(function(line){
      var m=line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
      if(m){
        var t=parseInt(m[1])*60+parseInt(m[2])+parseInt(m[3])/(m[3].length===2?100:1000);
        var txt=m[4].trim();
        if(txt)lines.push({t:t,l:txt});
      }
    });
    cb(lines);
  }).catch(function(){cb([]);});
}

/* ---- 选歌播放 ---- */
function selSong(i){
  if(i<0||i>=playlist.length)return;
  ci=i;var s=playlist[i];
  $("songTitle").textContent=s.title;
  $("songArtist").textContent=s.artist||"";
  $("lyricTitle").textContent=s.title;
  $("lyricArtist").textContent=s.artist||"";
  var lb=$("coverLabel");
  if(s.cover)lb.innerHTML='<img src="'+esc(s.cover)+'"/>';
  else lb.innerHTML='<span class="placeholder">&#9835;</span>';
  $("seekBar").max=0;$("seekBar").value=0;
  $("trackFill").style.width="0%";$("trackThumb").style.left="0%";
  $("curTime").textContent="0:00";$("durTime").textContent="0:00";
  renderPL();

  if(s.neteaseId){
    $("songArtist").textContent=(s.artist||"")+" · 加载中...";
    getSongUrl(s.neteaseId,function(url){
      if(!url){$("songArtist").textContent=(s.artist||"")+" · 无版权";return;}
      au.src=url;au.currentTime=0;
      au.play().then(function(){playing=true;upState();$("coverGlow").classList.add("on");}).catch(function(){playing=false;upState();});
      $("songArtist").textContent=s.artist||"";
    });
    getLyric(s.neteaseId,function(ly){
      s.lyrics=ly;renderLy(s);
    });
  }else{
    au.src=s.url||"";au.currentTime=0;
    renderLy(s);
    au.play().then(function(){playing=true;upState();$("coverGlow").classList.add("on");}).catch(function(){playing=false;upState();});
  }
}

function tog(){if(ci<0){if(playlist.length)selSong(0);return;}if(au.paused){au.play().then(function(){playing=true;upState();$("coverGlow").classList.add("on");}).catch(function(){});}else{au.pause();playing=false;upState();}}
function upState(){var si=function(el){if(playing)el.innerHTML='<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';else el.innerHTML='<polygon points="8,5 19,12 8,19"/>';};si($("playIcon"));si($("lyPlayIcon"));if(playing){$("coverDisc").classList.add("spin");avatarsTogether();}else{$("coverDisc").classList.remove("spin");avatarsApart();}}
function nxt(){if(!playlist.length)return;selSong((ci+1)%playlist.length);}
function prv(){if(!playlist.length)return;if(au.currentTime>3)au.currentTime=0;else selSong((ci-1+playlist.length)%playlist.length);}
au.addEventListener("loadedmetadata",function(){$("seekBar").max=au.duration||0;$("durTime").textContent=fmt(au.duration);});
au.addEventListener("timeupdate",function(){if(!seeking){var c=au.currentTime,d=au.duration||1;$("seekBar").value=c;$("curTime").textContent=fmt(c);var p=(c/d*100)+"%";$("trackFill").style.width=p;$("trackThumb").style.left=p;upLyric(c);}});
au.addEventListener("ended",nxt);
var seeking=false;
$("seekBar").addEventListener("input",function(){seeking=true;var v=$("seekBar").value;$("curTime").textContent=fmt(v);var d=au.duration||1,p=(v/d*100)+"%";$("trackFill").style.width=p;$("trackThumb").style.left=p;});
$("seekBar").addEventListener("change",function(){au.currentTime=$("seekBar").value;seeking=false;});
$("btnPlay").addEventListener("click",tog);$("btnPrev").addEventListener("click",prv);$("btnNext").addEventListener("click",nxt);
$("lyPlay").addEventListener("click",tog);$("lyPrev").addEventListener("click",prv);$("lyNext").addEventListener("click",nxt);
var mask=$("panelMask");
function closeP(){document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("open");});mask.classList.remove("on");}
function togP(p){var o=p.classList.contains("open");closeP();if(!o){p.classList.add("open");mask.classList.add("on");}}
$("openPlaylist").addEventListener("click",function(){renderPL();togP($("playlistPanel"));});
$("openSearch").addEventListener("click",function(){togP($("searchPanel"));});
mask.addEventListener("click",closeP);
$("openLyrics").addEventListener("click",function(){$("lyricsPanel").classList.add("open");});
$("lyricsClose").addEventListener("click",function(){$("lyricsPanel").classList.remove("open");});
var cLy=[];
function renderLy(song){var b=$("lyricsBody");b.innerHTML="";cLy=song.lyrics||[];if(!cLy.length){b.innerHTML='<div class="lyric-line" style="color:var(--text2);">暂无歌词</div>';return;}cLy.forEach(function(l,i){var d=document.createElement("div");d.className="lyric-line";d.dataset.idx=i;d.textContent=l.l;b.appendChild(d);});}
function upLyric(t){if(!cLy.length)return;var ai=0;for(var i=cLy.length-1;i>=0;i--){if(t>=cLy[i].t){ai=i;break;}}var ls=$("lyricsBody").querySelectorAll(".lyric-line");ls.forEach(function(el,i){if(i===ai){if(!el.classList.contains("active")){el.classList.add("active");el.scrollIntoView({behavior:"smooth",block:"center"});}}else el.classList.remove("active");});}

/* ---- 网易云搜索 ---- */
$("searchBtn").addEventListener("click",doS);
$("searchInput").addEventListener("keydown",function(e){if(e.key==="Enter")doS();});
function doS(){
  var q=$("searchInput").value.trim();
  if(!q)return;
  $("searchResults").innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">搜索中...</div>';
  fetch(API+"/cloudsearch?keywords="+encodeURIComponent(q)+"&limit=20").then(function(r){return r.json();}).then(function(j){
    var songs=(j.result&&j.result.songs)||[];
    if(!songs.length){$("searchResults").innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">没有找到相关歌曲</div>';return;}
    var box=$("searchResults");box.innerHTML="";
    songs.forEach(function(s){
      var ar=(s.ar||[]).map(function(a){return a.name;}).join("/");
      var cover=(s.al&&s.al.picUrl)?s.al.picUrl+"?param=200y200":"";
      var d=document.createElement("div");
      d.className="song-item";
      d.innerHTML='<div class="song-meta"><div class="sname">'+esc(s.name)+'</div><div class="sartist">'+esc(ar)+'</div></div><button class="add-btn" style="border:none;background:rgba(255,255,255,.08);color:var(--text2);border-radius:20px;padding:4px 14px;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;">+ 添加</button>';
      var added=false;
      d.querySelector(".add-btn").addEventListener("click",function(e){
        e.stopPropagation();
        if(added)return;
        added=true;
        this.textContent="已添加";this.style.color="var(--accent)";
        var song={title:s.name,artist:ar,cover:cover,neteaseId:s.id,url:"",lyrics:[]};
        playlist.push(song);
        savePL();
        renderPL();
      });
      d.addEventListener("click",function(){
        if(!added){
          var song={title:s.name,artist:ar,cover:cover,neteaseId:s.id,url:"",lyrics:[]};
          playlist.push(song);
          savePL();
        }
        var idx=playlist.length-1;
        for(var k=0;k<playlist.length;k++){if(playlist[k].neteaseId===s.id){idx=k;break;}}
        selSong(idx);
        closeP();
      });
      box.appendChild(d);
    });
  }).catch(function(){
    $("searchResults").innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px;">搜索出错了，再试一次</div>';
  });
}

/* ---- 歌单本地存储 ---- */
function savePL(){
  var data=playlist.map(function(s){return{title:s.title,artist:s.artist,cover:s.cover,neteaseId:s.neteaseId||null};});
  localStorage.setItem("our_playlist",JSON.stringify(data));
}
function loadPL(){
  try{
    var raw=localStorage.getItem("our_playlist");
    if(raw){
      var arr=JSON.parse(raw);
      if(arr&&arr.length){
        playlist=arr.map(function(s){return{title:s.title,artist:s.artist,cover:s.cover||"",neteaseId:s.neteaseId||null,url:"",lyrics:[]};});
      }
    }
  }catch(e){}
}
loadPL();
renderPL();upState();
