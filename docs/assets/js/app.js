window.AppHelpers = {
  go(path){ 
    window.location.href = path; 
  },
  qs(name){ 
    return new URLSearchParams(window.location.search).get(name); 
  },
  setStore(key, value){ 
    localStorage.setItem(key, JSON.stringify(value)); 
  },
  getStore(key, fallback=null){ 
    try { 
      return JSON.parse(localStorage.getItem(key)) ?? fallback; 
    } catch(e){ 
      return fallback; 
    } 
  },
  renderHeader(title, sub=''){
    return `<section class="page-hero"><div class="container"><h1 class="page-title">${title}</h1><p class="page-sub">${sub}</p></div></section>`;
  }
};

window.Api = {
  async post(action, payload={}){
    const res = await fetch(window.APP_CONFIG.API_URL, {
      method:'POST',
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  }
};
