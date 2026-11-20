
//TMDB API ayarları
const API_KEY = "ecd1a3f4731ce483bb20414dd8e98578";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";


let currentPage = 1;


//Filtreleme Takip Değişkenleri

let currentContentType = "all";  //"all", "movie" , "tv", "documentary"
let currentGenreId = "all"; //"all" veya sayısal tür ID si örn aksiyon=28
let currentGenreName = "all"; //seçilen türün adını (macera,aksiyon vb) aklında tutar
let currentMovieId = null;
let currentMediaType = "movie";
let currentMovieData = null;
let currentView = "home"; // "home", "savedMovies" veya "watchedMovies"
let currentUserMovies = []; // Kullanıcının o an açık olan kayıtlı filmlerini saklar


//Akıllı Filtreli İçerik Çekme Fonksiyonu 
async function fetchFilteredContent(page = 1) {
    if (typeof page != "number") page = 1;

    try {
        let url = "";

        // Seçilen içerik tipine göre adresi belirle (Dizi ise "tv", değilse "movie")
        const typePath = (currentContentType === "tv") ? "tv" : "movie";

        // 1. Durum: Bir tür seçildiyse (Aksiyon, Macera vb.)
        if (currentGenreId !== "all") {
            url = `${BASE_URL}/discover/${typePath}?api_key=${API_KEY}&language=tr-TR&page=${page}&with_genres=${currentGenreId}`;
        }

        // 2. Durum: Sadece Filmler seçildiyse
        else if (currentContentType === "movie") {
            url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=tr-TR&page=${page}&sort_by=popularity.desc`;
        }
        // 3. Durum: Sadece Diziler seçildiyse
        else if (currentContentType === "tv") {
            url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=tr-TR&page=${page}&sort_by=popularity.desc`;
        }
        // 4. Durum: Tümü seçildiyse (Filmler VE Diziler Karışık Olarak - Trend İçerikler)
        else {
            url = `${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=tr-TR&page=${page}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        // "Tümü" seçiliyken trend listesinden sadece film ve dizi sonuçlarını al
        // (bu listede ünlü/kişi kartları da karışık gelebiliyor)
        const items = (currentContentType === "all" && currentGenreId === "all")
            ? (data.results || []).filter(item => item.media_type === "movie" || item.media_type === "tv")
            : (data.results || []);

        displayMovies(items);

        document.getElementById("pageNumberDisplay").innerText = `Sayfa ${page}`;
        const prevBtn = document.getElementById("prevPageBtn");
        if (prevBtn) prevBtn.disabled = (page === 1);
    } catch (error) {
        console.error("Filtreli içerik çekilirken hata oluştu:", error);
    }
}


// 1. TMDB API'den Popüler Filmleri Çeken Asenkron Fonksiyon
async function fetchPopularMovies(page = 1) {
    //Eğer fonksiyona sayı yerine Event objesi geldiyse zorla 1 yap
    if (typeof page !== "number") page = 1;

    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=tr-TR&page=${page}`);
        const data = await response.json();

        displayMovies(data.results);
        // Sayfa numarasını ekrandaki yazıya basıyoruz (Örn: "Sayfa 2")
        document.getElementById("pageNumberDisplay").innerText = `Sayfa ${page}`;
        // 1. Sayfadaysak "Önceki Sayfa" butonunu pasif, 2. sayfadaysak aktif yapıyoruz
        const prevBtn = document.getElementById("prevPageBtn");
        if (prevBtn) {
            prevBtn.disabled = (page === 1);
        }
    } catch (error) {
        console.error("Film verisi çekilirken hata oluştu:", error);
    }
}


// 1.5. TMDB API'den Türleri Çeken ve Dropdown'a Dolduran Fonksiyon
async function fetchGenres() {
    try {
        const typePath = (currentContentType === "tv") ? "tv" : "movie";
        const response = await fetch(`${BASE_URL}/genre/${typePath}/list?api_key=${API_KEY}&language=tr-TR`);
        const data = await response.json();

        const genreDropdownMenu = document.getElementById("genreDropdownMenu");
        // Başlangıçta "Tüm Türler" seçili gelsin
        genreDropdownMenu.innerHTML = '<li><a class="dropdown-item active" href="#" data-genre="all">Tüm Türler</a></li>';

        // O kategorinin türlerini listeye ekle
        data.genres.forEach(genre => {
            const li = document.createElement("li");
            li.innerHTML = `<a class="dropdown-item" href="#" data-genre="${genre.id}">${genre.name}</a>`;
            genreDropdownMenu.appendChild(li);
        });

    } catch (error) {
        console.error("Türler çekilirken hata oluştu:", error);
    }
}






// 2. Gelen Film Dizisini HTML Kartlarına Dönüştürüp Ekrana Basan Fonksiyon
//  API'den gelen 20 filmlik movies dizisini (Array) kabul eden yeni bir fonksiyondur.
function displayMovies(movies) {
    const popularMoviesGrid = document.getElementById("popularMoviesGrid");
    popularMoviesGrid.innerHTML = ""; //Eski taslak kartı temizliyoruz

    movies.forEach(movie => {
        const title = movie.title || movie.name || "İsimsiz";
        // 1. Film Afiş Resmi (TMDB adresi ile birleştiriyoruz)
        const posterPath = movie.poster_path
            ? (movie.poster_path.startsWith("http") ? movie.poster_path : `${IMAGE_URL}${movie.poster_path}`)
            : "https://via.placeholder.com/500x750?text=Afi%C5%9F+Yok";


        const releaseDate = movie.release_date || movie.first_air_date;
        const releaseYear = releaseDate ? releaseDate.split("-")[0] : "Bilinmiyor";



        // 3. IMDb Puanı (8.342 gibi uzun puanı virgülden sonra tek haneye "8.3" yuvarlıyoruz)
        const rating = (typeof movie.vote_average === "number")
            ? movie.vote_average.toFixed(1)
            : (movie.vote_average || "N/A");


        const isTv = movie.media_type === "tv" || movie.type === "tv" || Boolean(movie.name || movie.first_air_date) || (currentContentType === "tv");
        const mediaType = isTv ? "tv" : "movie";
        const typeBadge = isTv ? "Dizi" : "Film";

        // 4. Dinamik HTML Kart Şablonu 
        //Çift tırnak ile çok satırlı HTML kodu yazamazsın (hata verir).
        //Çift tırnak içine JavaScript değişkeni gömemezsin.
        //Backtick sayesinde HTML kodunu birebir yazıp, aralarına ${deger} diyerek canlı veri enjekte edebiliriz!
        const movieCardHTML = `
            <div class="col"> 
                <div class="card movie-card h-100 border-0 rounded-4 overflow-hidden shadow position-relative" style="cursor: pointer;" data-id="${movie.id}" data-type="${mediaType}">
                                       <div class="position-relative">
                        <img src="${posterPath}" class="card-img-top movie-poster" alt="${movie.title}">
                        <span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2 fw-bold">
                            <i class="fa-solid fa-star me-1"></i>${rating}
                        </span>

                        ${(currentView === "savedMovies" || currentView === "watchedMovies") ? `
                            <button class="btn btn-dark btn-sm rounded-circle position-absolute top-0 start-0 m-2 delete-movie-btn d-flex align-items-center justify-content-center shadow" 
                                    style="width: 28px; height: 28px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.3); z-index: 5;" 
                                    title="Listeden Kaldır" 
                                    onclick="removeMovieFromList(event, '${movie.id}')">
                                <i class="fa-solid fa-xmark text-danger" style="font-size: 0.85rem;"></i>
                            </button>
                        ` : ''}
                    </div>
                                       <div class="card-body p-3 custom-card-body text-white">
                        <h6 class="card-title fw-bold text-truncate mb-1" title="${title}">${title}</h6>
                        <div class="d-flex align-items-center justify-content-between text-muted small">
                            <span>${releaseYear}</span>
                            <span class="badge bg-purple-badge">${typeBadge}</span>
                        </div>

                        ${currentView === "watchedMovies" ? `
                            ${movie.isFavorite ? `
                                <div class="badge bg-danger mt-2 py-1 px-2 text-start">
                                    <i class="fa-solid fa-heart me-1"></i>Favorilerimde
                                </div>
                            ` : ''}
                            ${movie.userRating ? `
                                <div class="text-warning small fw-bold mt-1" style="font-size: 0.75rem;">
                                    <i class="fa-solid fa-star me-1"></i>Puanım: ${movie.userRating}/10
                                </div>
                            ` : ''}
                            ${movie.userReview ? `
                                <div class="p-1 px-2 rounded bg-black bg-opacity-50 text-white-50 mt-1 fst-italic text-truncate" style="font-size: 0.7rem;">
                                    <i class="fa-solid fa-quote-left text-purple me-1"></i>"${movie.userReview}"
                                </div>
                            ` : ''}
                            <button class="btn btn-outline-purple btn-sm rounded-pill w-100 mt-2 py-1" 
                                    style="font-size: 0.72rem;" 
                                    onclick="openMovieReviewModal(event, '${movie.id}')">
                                <i class="fa-solid fa-pen-to-square me-1"></i>${(movie.userRating || movie.userReview) ? 'Puanı / Yorumu Düzenle' : 'Puanla & Yorum Yap'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Oluşturduğumuz kartı ekrandaki Izgara kutusuna ekliyoruz
        popularMoviesGrid.innerHTML += movieCardHTML;

    });

}

// Sayfa Yüklendiğinde 1. Sayfa İçeriklerini (Film + Dizi Karışık) ve Türler Listesini Getir
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        fetchFilteredContent(1);
        fetchGenres();
    });
} else {
    fetchFilteredContent(1);
    fetchGenres();
}



//Sonraki sayfa butonuna tıklanınca
document.getElementById("nextPageBtn").addEventListener("click", () => {
    // Ana sayfa görünümü dışında (Kaydedilenler / İzlediklerim) sayfalama yapılmaz
    if (currentView !== "home") return;

    currentPage++// sayfa numarasını  1 arttır
    fetchFilteredContent(currentPage);//yeni sayfadaki içerikleri SEÇİLİ FİLTREYE UYGUN şekilde getir
    window.scrollTo({ top: 0, behavior: 'smooth' }) //sayfayı yumuşakça en üste kaydır

});

//Önceki sayfa butonuna tıklanınca
document.getElementById("prevPageBtn").addEventListener("click", () => {
    // Ana sayfa görünümü dışında (Kaydedilenler / İzlediklerim) sayfalama yapılmaz
    if (currentView !== "home") return;

    if (currentPage > 1) {
        currentPage--; //sayfa numarasını 1 azalt
        fetchFilteredContent(currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});



//3. İçerik Tipi Butonlarına (Tümü, Filmler, Diziler, Belgeseller) Tıklanınca
document.getElementById("contentTypeButtons").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-category");
    if (!btn) return; //butona basılmadıysa işlem yapma

    document.querySelectorAll("#contentTypeButtons .btn-category").forEach(b => b.classList.remove("active"));

    //sadece yeni tıklanan kategori butonuna active sınıfını ekle
    btn.classList.add("active");


    //Seçilen içerik tipini all, movie, tv , documentary takibe al
    currentContentType = btn.dataset.type;

    // Başlığı seçilen türe göre (Tümü, Film, Dizi) dinamik olarak güncelle
    // Başlığı sadece ana sayfadaysak güncelle
    if (currentView === "home") {
        const titleEl = document.querySelector(".section-title");
        if (currentContentType === "movie") {
            titleEl.innerHTML = `<i class="fa-solid fa-film text-purple me-2"></i>Popüler Filmler`;
        } else if (currentContentType === "tv") {
            titleEl.innerHTML = `<i class="fa-solid fa-tv text-purple me-2"></i>Popüler Diziler`;
        } else {
            titleEl.innerHTML = `<i class="fa-solid fa-fire text-purple me-2"></i>Popüler İçerikler`;
        }
    }

    // Tür seçimini sıfırla ve yeni kategoriye uygun türleri indir
    currentGenreId = "all";
    document.getElementById("genreDropdownBtn").innerHTML = `<i class="fa-solid fa-filter me-1"></i>Tüm Türler`;
    fetchGenres();


    //sayfa numarasını 1 yapıp yeni filtrelenmiş verileri çek
    currentPage = 1;
    if (currentView === "home") {
        fetchFilteredContent(1);
    } else {
        filterUserMovies();
    }
});


// Türler menüsüne tıklanınca
document.getElementById("genreDropdownMenu").addEventListener("click", (e) => {
    const genreLink = e.target.closest(".dropdown-item");
    if (!genreLink) return;

    document.querySelectorAll("#genreDropdownMenu .dropdown-item").forEach(i => i.classList.remove("active"));
    genreLink.classList.add("active");

    currentGenreId = genreLink.dataset.genre;

    // Eğer "Tüm Türler" seçildiyse sadece "Türler" yaz, bir tür seçildiyse doğrudan adını yaz (Örn: "Macera")
    if (currentGenreId === "all") {
        currentGenreName = "all";
        document.getElementById("genreDropdownBtn").innerHTML = `<i class="fa-solid fa-filter me-1"></i> Tüm Türler`;
    } else {
        currentGenreName = genreLink.innerText.trim();
        document.getElementById("genreDropdownBtn").innerHTML = `<i class="fa-solid fa-filter me-1"></i> ${currentGenreName}`;
    }

    currentPage = 1;
    if (currentView === "home") {
        fetchFilteredContent(1);
    } else {
        filterUserMovies();
    }

});

// TMDB API'den canlı arama yapan fonksiyon
// Seçili içerik türü filtresine (Filmler / Diziler) saygı duyar:
// "Filmler" seçiliyken sadece film, "Diziler" seçiliyken sadece dizi,
// "Tümü" seçiliyken ise film ve dizi sonuçları karışık aranır.
async function searchContent(query) {
    try {
        let url;
        if (currentContentType === "movie") {
            // Sadece film sonuçları ara
            url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}`;
        } else if (currentContentType === "tv") {
            // Sadece dizi sonuçları ara
            url = `${BASE_URL}/search/tv?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}`;
        } else {
            // Film + dizi karışık ara
            url = `${BASE_URL}/search/multi?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        let results = data.results || [];

        // Karışık aramada kişi (person) gibi geçersiz sonuçları listeden ayıkla
        if (currentContentType !== "movie" && currentContentType !== "tv") {
            results = results.filter(item => item.media_type === "movie" || item.media_type === "tv");
        }

        displayMovies(results);
    } catch (error) {
        console.error("Arama yapılırken hata oluştu:", error);
    }
}

// !!!!!!!!! Arama kutusuna her harf yazıldığında çalışır !!!!!!!!
document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (query.length > 0) {
        searchContent(query);
    } else {
        fetchFilteredContent(1); //Arama kutusu temizlenirse normal filmleri geri getir
    }
});


//Film kartlarından birine tıklanınca detayları göster
document.getElementById("popularMoviesGrid").addEventListener("click", (e) => {
    // Listeden kaldır veya puanlama butonuna tıklandıysa detay açma
    if (e.target.closest(".delete-movie-btn") || e.target.closest("button")) return;

    const card = e.target.closest(".movie-card");
    if (!card) return; //Film kartına tıklanmadıysa işlem yapma

    const movieId = card.dataset.id;
    const mediaType = card.dataset.type || "movie";
    showMovieDetails(movieId, mediaType);
});


//Tıklanan filmin detaylarını çeken fonksiyon
async function showMovieDetails(movieId, mediaType = "movie") {
    currentMovieId = movieId;
    currentMediaType = mediaType;

    // Vitrini anında aç ve yükleniyor göster (önceki filmin bilgisi kalmasın)
    const heroSection = document.getElementById("heroSection");
    heroSection.classList.remove("d-none");
    heroSection.scrollIntoView({ behavior: "smooth" });

    document.getElementById("heroTitle").innerText = "Yükleniyor...";
    document.getElementById("heroOverview").innerText = "İçerik bilgileri getiriliyor...";
    document.getElementById("heroDetailsBar").innerHTML = `<span class="badge bg-secondary-purple fs-6 px-3 py-2"><i class="fa-solid fa-spinner fa-spin me-1"></i> Yükleniyor...</span>`;
    document.getElementById("heroCast").innerHTML = `<div class="text-muted small py-2"><i class="fa-solid fa-spinner fa-spin me-1"></i> Oyuncular yükleniyor...</div>`;

    let endpoint = mediaType === "tv" ? "tv" : "movie";
    let response = await fetch(`${BASE_URL}/${endpoint}/${movieId}?api_key=${API_KEY}&language=tr-TR`);
    let movie = await response.json();

    //Eğer ilk sorguda bulunamadıysa alternatif türe bak
    if (movie.success === false) {
        endpoint = endpoint === "tv" ? "movie" : "tv";
        response = await fetch(`${BASE_URL}/${endpoint}/${movieId}?api_key=${API_KEY}&language=tr-TR`);
        movie = await response.json();
    }

    const title = movie.title || movie.name || "İsimsiz";
    const overview = movie.overview || "Bu içerik için Türkçe özet bulunmuyor.";

    const runtime = movie.runtime ? `${movie.runtime} dk` : (movie.number_of_seasons ? `${movie.number_of_seasons} Sezon` : "Bilinmiyor");
    const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "Bilinmiyor";
    const country = movie.production_countries?.[0]?.name || "Bilinmiyor";
    const genres = movie.genres ? movie.genres.map(g => g.name).join(", ") : "Bilinmiyor";


    const posterPath = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : "https://via.placeholder.com/500x750?text=Afi%C5%9F+Yok";

    document.getElementById("heroTitle").innerText = title;
    document.getElementById("heroOverview").innerText = overview;
    document.getElementById("heroPoster").src = posterPath;
    document.getElementById("heroRating").innerText = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    currentMovieData = {
        id: movieId,
        title: title,
        poster_path: posterPath,
        vote_average: movie.vote_average ?
            movie.vote_average.toFixed(1) : "N/A",
        release_date: year,
        type: (movie.name || movie.first_air_date) ? "tv" : "movie",
        genre_ids: movie.genres ? movie.genres.map(g => g.id) : []
    };

    document.getElementById("heroDetailsBar").innerHTML = `
        <span class="badge bg-secondary-purple fs-6 px-3 py-2"><i class="fa-regular fa-clock text-purple me-1"></i> ${runtime}</span>
        <span class="badge bg-secondary-purple fs-6 px-3 py-2"><i class="fa-regular fa-calendar-days text-purple me-1"></i> ${year}</span>
        <span class="badge bg-secondary-purple fs-6 px-3 py-2"><i class="fa-solid fa-earth-americas text-purple me-1"></i> ${country}</span>
        <span class="badge bg-purple-badge fs-6 px-3 py-2"><i class="fa-solid fa-masks-theater me-1"></i> ${genres}</span>
    `;


    //Oyuncu kadrosunu çekip kutuyu temizliyoruz
    const cast = await fetchCast(movieId, endpoint);
    const heroCast = document.getElementById("heroCast");
    heroCast.innerHTML = "";

    cast.forEach(actor => {
        const photo = actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : "https://via.placeholder.com/100x100?text=Foto+Yok";
        heroCast.innerHTML += `
            <div class="text-center" style="min-width: 70px;">
                <img src="${photo}" class="rounded-circle mb-1 shadow" style="width: 55px; height: 55px; object-fit: cover;" alt="${actor.name}">
                <div class="fw-bold text-white small text-truncate" style="max-width: 75px; font-size: 0.75rem;" title="${actor.name}">${actor.name}</div>
                <div class="text-muted" style="max-width: 75px; font-size: 0.65rem;" title="${actor.character}">${actor.character}</div>
            </div>
        `;
    });

    //butonları sıfırla ve bu film listelerde kayıtlı mı kontrol et
    const addBtn = document.getElementById("heroAddListBtn");
    const watchedBtn = document.getElementById("heroWatchedBtn");
    addBtn.innerHTML = `<i class="fa-solid fa-plus me-2"></i> Listeme Kaydet`;
    watchedBtn.innerHTML = `<i class="fa-solid fa-eye me-2"></i> İzlenenlere Kaydet`;


    if (currentUser) {
        try {
            const checkDoc = await db.collection("users").doc(currentUser.uid).collection("savedMovies").doc(String(movieId)).get();
            if (checkDoc.exists) addBtn.innerHTML = `<i class="fa-solid fa-check me-2 text-success"></i> Listeye Eklendi`;

            const checkWatched = await db.collection("users").doc(currentUser.uid).collection("watchedMovies").doc(String(movieId)).get();
            if (checkWatched.exists) watchedBtn.innerHTML = `<i class="fa-solid fa-check me-2 text-success"></i> İzlendi`;
        } catch (e) {
            console.warn("Kayıt durumu kontrol edilemedi:", e);
        }
    }



    history.pushState({ movieId: movieId }, "", `#movie-${movieId}`);
}

// Geri Ok Butonuna Basılınca Siteden Çıkmak Yerine Vitrini Kapatır
window.addEventListener("popstate", () => {
    document.getElementById("heroSection").classList.add("d-none");
});


// TMDB'den Fragman linkini çeken fonksiyon
async function fetchTrailer(movieId, mediaType = "movie") {
    if (!movieId) return;

    let endpoint = mediaType === "tv" ? "tv" : "movie";
    let response = await fetch(`${BASE_URL}/${endpoint}/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
    let data = await response.json();

    // Eğer ilk sorguda fragman bulunamadıysa alternatif türe bakar
    if (!data.results || data.results.length === 0) {
        endpoint = endpoint === "tv" ? "movie" : "tv";
        response = await fetch(`${BASE_URL}/${endpoint}/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
        data = await response.json();
    }

    // YouTube üzerindeki "Trailer" (Fragman) tipindeki videoyu yakalar
    const trailer = data.results?.find(v => v.type === "Trailer" && v.site === "YouTube") || data.results?.[0];

    if (trailer) {
        // Sitede video oynatmak yerine doğrudan resmi YouTube sayfasını yeni sekmede açar
        window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank", "noopener,noreferrer");
    } else {
        alert("Üzgünüz, bu içerik için YouTube fragmanı bulunamadı.");
    }
}

// 10. "Fragmanı İzle" Butonuna Tıklanınca Fragmanı Aç
document.getElementById("heroTrailerBtn").addEventListener("click", () => {
    fetchTrailer(currentMovieId, currentMediaType || "movie");
});



// 9.5 TMDB'den Oyuncu Kadrosunu Çeken Fonksiyon
async function fetchCast(movieId, mediaType = "movie") {
    let endpoint = mediaType === "tv" ? "tv" : "movie";
    let response = await fetch(`${BASE_URL}/${endpoint}/${movieId}/credits?api_key=${API_KEY}&language=tr-TR`);
    let data = await response.json();

    //Eğer ilk sorguda bulunamazsa alternatif türe bakar
    if (!data.cast || data.cast.length === 0) {
        endpoint = endpoint === "tv" ? "movie" : "tv";
        response = await fetch(`${BASE_URL}/${endpoint}/${movieId}/credits?api_key=${API_KEY}&language=tr-TR`);
        data = await response.json();
    }

    return data.cast ? data.cast.slice(0, 15) : [];
}

// KULLANICI GİRİŞ & KAYIT YÖNETİMİ (AUTH)
// Firebase Ayarları ve Canlı Bağlantısı
const firebaseConfig = {
    apiKey: "AIzaSyBeNy5zHjOHwlvt76bfVU5Am3ixuJn_BXc",
    authDomain: "filmterest-87188.firebaseapp.com",
    projectId: "filmterest-87188",
    storageBucket: "filmterest-87188.firebasestorage.app",
    messagingSenderId: "484427544939",
    appId: "1:484427544939:web:952ac91af54e454c9ab42e",
    measurementId: "G-YYWKRXN9F7"
};


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let authMode = "login"; //login giriş veya register kayıt
const loginTabBtn = document.getElementById("loginTabBtn");
const registerTabBtn = document.getElementById("registerTabBtn");


const authModalTitle = document.getElementById("authModalTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authErrorMsg = document.getElementById("authErrorMsg");


// "Kayıt Ol" sekmesine tıklanınca
registerTabBtn.addEventListener("click", () => {
    authMode = "register";
    authModalTitle.innerText = "Kayıt Ol";
    authSubmitBtn.innerText = "Kayıt Ol";
    registerTabBtn.classList.replace("text-white-50", "btn-purple");
    loginTabBtn.classList.replace("btn-purple", "text-white-50");
});


// "Giriş Yap" Sekmesine Tıklanınca
loginTabBtn.addEventListener("click", () => {
    authMode = "login";
    authModalTitle.innerText = "Giriş Yap";
    authSubmitBtn.innerText = "Giriş Yap";
    loginTabBtn.classList.replace("text-white-50", "btn-purple");
    registerTabBtn.classList.replace("btn-purple", "text-white-50");
});

//// 13. Form Gönderildiğinde (Giriş & Kayıt İşlemi)
document.getElementById("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    authErrorMsg.classList.add("d-none");

    try {
        if (authMode === "register") { //kayıt ol seçildiyse
            await auth.createUserWithEmailAndPassword(email, password);
        } else { //giriş yap seçildiyse
            await auth.signInWithEmailAndPassword(email, password);
        }
        bootstrap.Modal.getInstance(document.getElementById("authModal")).hide();
        document.getElementById("authForm").reset(); //kutuları resertler
    } catch (error) {
        authErrorMsg.innerText = error.message; //gelen hatanın açıklamasını kırmızı hata kutusunun içine yazar
        authErrorMsg.classList.remove("d-none");
    }

});

//Kullanıcı oturum takibi (login/logout)
let currentUser = null;
const authBtn = document.getElementById("authBtn");

// 21. PROFİL & HESAP YÖNETİMİ VERİLERİ (Erken Tanımlama)
const defaultAvatars = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Milo",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe"
];
let currentAvatarUrl = defaultAvatars[0];

// Oturum durumu değiştiğinde (Giriş/Çıkış yapıldığında)
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    const authBtn = document.getElementById("authBtn");
    const userDropdown = document.getElementById("userDropdown");

    if (user) {
        authBtn.classList.add("d-none"); // "Giriş Yap" butonunu gizle
        userDropdown.classList.remove("d-none"); // Profil menüsünü göster
        await loadUserProfileData(); // Kullanıcının adı ve avatarını getir
    } else {
        authBtn.classList.remove("d-none"); // "Giriş Yap" butonunu göster
        userDropdown.classList.add("d-none"); // Profil menüsünü gizle
    }
});

// Dropdown'daki Çıkış Yap Butonu
document.getElementById("dropdownLogoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showConfirmModal({
        title: "Çıkış Yapmak İstediğinize Emin Misiniz?",
        message: "Oturumunuz kapatılacak. Tekrar giriş yaparak tüm içeriklerinize ulaşabilirsiniz.",
        btnText: "Çıkış Yap",
        btnClass: "btn-outline-danger",
        icon: "fa-right-from-bracket text-warning",
        onConfirm: () => auth.signOut()
    });
});

// Profil Modalındaki Çıkış Yap Butonu
document.getElementById("settingsLogoutBtn")?.addEventListener("click", () => {
    showConfirmModal({
        title: "Çıkış Yapmak İstediğinize Emin Misiniz?",
        message: "Oturumunuz kapatılacak. Tekrar giriş yaparak tüm içeriklerinize ulaşabilirsiniz.",
        btnText: "Çıkış Yap",
        btnClass: "btn-outline-danger",
        icon: "fa-right-from-bracket text-warning",
        onConfirm: () => auth.signOut()
    });
});

// Listeme kaydet butonuna tıklanınca 
document.getElementById("heroAddListBtn").addEventListener("click", async () => {
    if (!currentUser) {
        alert("Kaydetmek için lütfen önce giriş yapın!");
        new
            bootstrap.Modal(document.getElementById("authModal")).show();
        return;
    }
    if (!currentMovieData) return;


    const movieRef = db.collection("users").doc(currentUser.uid).collection("savedMovies").doc(String(currentMovieData.id));
    const docSnap = await movieRef.get();

    if (docSnap.exists) {
        await movieRef.delete();
        document.getElementById("heroAddListBtn").innerHTML = `<i class="fa-solid fa-plus me-2"></i> Listeme Kaydet`;
    } else {
        await movieRef.set(currentMovieData);
        document.getElementById("heroAddListBtn").innerHTML = `<i class="fa-solid fa-check me-2 text-success"></i> Listeye Kaydedildi`;
    }

});

// 16. "İzlenenlere Kaydet" Butonuna Tıklanınca
document.getElementById("heroWatchedBtn").addEventListener("click", async () => {
    if (!currentUser) {
        alert("İzlenenlere eklemek için lütfen önce giriş yapın!");
        new bootstrap.Modal(document.getElementById("authModal")).show();
        return;
    }
    if (!currentMovieData) return;

    const movieRef = db.collection("users").doc(currentUser.uid).collection("watchedMovies").doc(String(currentMovieData.id));
    const docSnap = await movieRef.get();

    if (docSnap.exists) {
        await movieRef.delete();
        document.getElementById("heroWatchedBtn").innerHTML = `<i class="fa-solid fa-eye me-2"></i> İzlenenlere Kaydet`;
    } else {
        await movieRef.set(currentMovieData);
        document.getElementById("heroWatchedBtn").innerHTML = `<i class="fa-solid fa-check me-2 text-success"></i> İzlendi`;
    }
});


//Kullanıcıların özel listelerini (kaydedilenler,izlediklerim) ekrana basan fonksiyon
async function loadUserMovies(collectionName, titleText, iconClass) {
    if (!currentUser) {
        alert("Listenizi görmek için lütfen önce giriş yapın!");
        new
            bootstrap.Modal(document.getElementById("authModal")).show();
        return;
    }

    //Vitrin (hero) açıksa gizleyelim
    document.getElementById("heroSection").classList.add("d-none");

    //başlığı ve ikonu güncelle (örn: kaydettiğim filmler)
    document.querySelector(".section-title").innerHTML = `<i class="${iconClass} text-purple me-2"></i>${titleText}`;


    // Sayfalandırma butonlarını gizle
    document.getElementById("paginationWrapper").classList.add("d-none");

    // Eski filmleri temizle ve yükleniyor animasyonu göster
    document.getElementById("popularMoviesGrid").innerHTML = `<div class="col-12 text-center py-5 text-muted"><h5><i class="fa-solid fa-spinner fa-spin me-2"></i>Listeniz yükleniyor...</h5></div>`;


    try {
        const snapshot = await db.collection("users").doc(currentUser.uid).collection(collectionName).get();
        const movies = [];
        snapshot.forEach(doc => movies.push(doc.data()));

        currentView = collectionName;
        currentUserMovies = movies;

        if (movies.length === 0) {
            document.getElementById("popularMoviesGrid").innerHTML = `<div class="col-12 text-center py-5 text-muted"><h5><i class="fa-regular fa-folder-open me-2"></i>Bu listede henüz hiç film bulunmuyor.</h5></div>`;
        } else {
            displayMovies(movies);
        }
    } catch (error) {
        document.getElementById("popularMoviesGrid").innerHTML = `<div class="col-12 text-center py-5 text-danger"><h5><i class="fa-solid fa-triangle-exclamation me-2"></i>Hata: ${error.message}</h5></div>`;
    }

}

// Kaydedilen filmleri Film/Dizi ve Tür seçimine göre anında süzer
function filterUserMovies() {
    let list = currentUserMovies;
    if (currentContentType === "movie") list = list.filter(m => m.type !== "tv" && !m.name && !m.first_air_date);
    if (currentContentType === "tv") list = list.filter(m => m.type === "tv" || m.name || m.first_air_date);
    if (currentGenreId !== "all") list = list.filter(m => m.genre_ids && m.genre_ids.includes(Number(currentGenreId)));

    if (list.length === 0) {
        document.getElementById("popularMoviesGrid").innerHTML = `<div class="col-12 text-center py-5 text-muted"><h5><i class="fa-regular fa-folder-open me-2"></i>Bu filtreye uygun kayıtlı içerik bulunamadı.</h5></div>`;
    } else {
        displayMovies(list);
    }
}


//KAYDEDİLENLER MENÜ LİNKİNE TIKLANINCA 
document.getElementById("savedMoviesLink").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".navbar-nav .nav-link").forEach(link => link.classList.remove("active"));

    document.getElementById("savedMoviesLink").classList.add("active");
    loadUserMovies("savedMovies", "Kaydedilenler", "fa-solid fa-bookmark");
});

// İZLEDİKLERİM MENÜ LİNKİNE TIKLANINCA
document.getElementById("watchedMoviesLink").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".navbar-nav .nav-link").forEach(link => link.classList.remove("active"));
    document.getElementById("watchedMoviesLink").classList.add("active");
    loadUserMovies("watchedMovies", "İzlediklerim", "fa-solid fa-eye");
});


// 19. "Ana Sayfa" Linkine veya Logoya Tıklanınca Ana Sayfaya Dönüş
function goToHomePage(e) {
    // Açık olan film vitrinini kapat ve sayfayı en üste kaydır
    document.getElementById("heroSection").classList.add("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });

    currentView = "home";
    currentUserMovies = [];
    if (e) e.preventDefault();
    document.querySelectorAll(".navbar-nav .nav-link").forEach(link => link.classList.remove("active"));
    document.getElementById("homeLink").classList.add("active");
    document.querySelector(".section-title").innerHTML = `<i class="fa-solid fa-fire text-purple me-2"></i>Popüler İçerikler`;
    document.getElementById("paginationWrapper").classList.remove("d-none");

    // Kategori butonlarını sıfırla ve "Tümü" butonunu aktif yap
    currentContentType = "all";
    document.querySelectorAll("#contentTypeButtons .btn-category").forEach(btn => btn.classList.remove("active"));
    const allBtn = document.querySelector('#contentTypeButtons [data-type="all"]');
    if (allBtn) allBtn.classList.add("active");
    // Türler açılır menüsünü sıfırla
    currentGenreId = "all";
    document.getElementById("genreDropdownBtn").innerHTML = `<i class="fa-solid fa-filter me-1"></i> Tüm Türler`;
    fetchGenres();

    currentPage = 1;
    fetchFilteredContent(1);
}

document.getElementById("homeLink").addEventListener("click", goToHomePage);
document.querySelector(".navbar-brand").addEventListener("click", goToHomePage);


// 20. FİLM ÇARKI DEĞİŞKENLERİ VE DİNAMİK ÇİZİM
let selectedWheelMovies = [];
const wheelColors = ["#780495", "#2a0135", "#9333ea", "#1c0024", "#6b21a8", "#380247", "#a855f7", "#15001c"];

// Çarkı seçilen filmlere göre tuvale (canvas) çizer
function renderWheel() {
    const canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const center = canvas.width / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Durum 1: Henüz hiç film eklenmediyse boş taslak çark göster
    if (selectedWheelMovies.length === 0) {
        ctx.beginPath();
        ctx.fillStyle = "#1a011d";
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#780495";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Film veya Dizi Ekleyin 🎬", center, center);
    } else {
        // Durum 2: Seçilen filmleri dilimler halinde çiz
        const arc = (2 * Math.PI) / selectedWheelMovies.length;
        selectedWheelMovies.forEach((movie, i) => {
            const angle = i * arc;
            ctx.beginPath();
            ctx.fillStyle = wheelColors[i % wheelColors.length];
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, angle, angle + arc);
            ctx.fill();

            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(angle + arc / 2);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "right";
            const title = (movie.title || movie.name || "Film").slice(0, 15);
            ctx.fillText(title, radius - 15, 4);
            ctx.restore();
        });

        // Çarkın ortasındaki altın halka
        ctx.beginPath();
        ctx.fillStyle = "#f1c40f";
        ctx.arc(center, center, 16, 0, 2 * Math.PI);
        ctx.fill();
    }

    updateWheelStatus();
}

// Çarkın altındaki rozetleri ve "En az 2 film seçin" uyarısını günceller
function updateWheelStatus() {
    const badgesContainer = document.getElementById("wheelSelectedBadges");
    const statusText = document.getElementById("wheelStatusText");
    const spinBtn = document.getElementById("spinWheelBtn");

    badgesContainer.innerHTML = selectedWheelMovies.map(m => `
        <span class="wheel-badge">
            ${(m.title || m.name).slice(0, 12)}
            <span class="remove-btn" onclick="toggleWheelMovie('${m.id}')">&times;</span>
        </span>
    `).join("");

    if (selectedWheelMovies.length < 2) {
        statusText.innerText = `Çarkı çevirmek için ${2 - selectedWheelMovies.length} film daha seçin.`;
        statusText.className = "text-warning small mb-2";
        spinBtn.disabled = true;
    } else {
        statusText.innerText = `${selectedWheelMovies.length} film hazır! Çarkı çevirebilirsin.`;
        statusText.className = "text-success small mb-2 fw-bold";
        spinBtn.disabled = false;
    }
}


let currentWheelCandidates = [];

// Sağ sütundaki filmleri TMDB'den çeker
async function loadWheelCandidates(query = "") {
    const listContainer = document.getElementById("wheelCandidatesList");
    listContainer.innerHTML = '<div class="text-center py-4 text-muted small"><i class="fa-solid fa-spinner fa-spin me-2"></i>Filmler yükleniyor...</div>';

    const url = query
        ? `${BASE_URL}/search/multi?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}`
        : `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=tr-TR&page=1`;

    const res = await fetch(url);
    const data = await res.json();
    currentWheelCandidates = (data.results || []).filter(m => m.poster_path);
    renderWheelCandidates();
}

// Gelen filmleri küçük kartlar halinde sağ tarafa dizer
function renderWheelCandidates() {
    const listContainer = document.getElementById("wheelCandidatesList");
    listContainer.innerHTML = currentWheelCandidates.map(movie => {
        const isSelected = selectedWheelMovies.some(m => String(m.id) === String(movie.id));
        const poster = `${IMAGE_URL}${movie.poster_path}`;
        const title = movie.title || movie.name || "İsimsiz";
        const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "";
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

        return `
            <div class="wheel-candidate-card d-flex align-items-center justify-content-between ${isSelected ? 'selected' : ''}" onclick="toggleWheelMovie('${movie.id}')">
                <div class="d-flex align-items-center gap-3 text-truncate">
                    <img src="${poster}" alt="${title}" style="width: 40px; height: 58px; object-fit: cover; border-radius: 6px;">
                    <div class="text-truncate">
                        <div class="fw-bold text-white small text-truncate" title="${title}">${title}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">
                            <i class="fa-solid fa-star text-warning me-1"></i>${rating} ${year ? '• ' + year : ''}
                        </div>
                    </div>
                </div>
                <button class="btn btn-sm ${isSelected ? 'btn-success' : 'btn-outline-light'} rounded-circle p-1 px-2">
                    <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-plus'}"></i>
                </button>
            </div>
        `;
    }).join("");
}

// Filme tıklanınca çarka ekleyen veya çarktan çıkaran fonksiyon
function toggleWheelMovie(movieId) {
    const index = selectedWheelMovies.findIndex(m => String(m.id) === String(movieId));

    if (index !== -1) {
        selectedWheelMovies.splice(index, 1); // Zaten varsa çıkar
    } else {
        if (selectedWheelMovies.length >= 10) {
            alert("En fazla 10 film ekleyebilirsiniz.");
            return;
        }
        const movie = currentWheelCandidates.find(m => String(m.id) === String(movieId));
        if (movie) selectedWheelMovies.push(movie); // Yoksa ekle
    }

    renderWheel();
    renderWheelCandidates();
}

// Menüdeki "Film Çarkı" linkine tıklanınca pencereyi aç ve filmleri getir
document.getElementById("wheelLink").addEventListener("click", (e) => {
    e.preventDefault();
    new bootstrap.Modal(document.getElementById("wheelModal")).show();
    renderWheel();
    loadWheelCandidates();
});

// Çarkın içindeki arama kutusuna her harf yazıldığında canlı ara
const wheelSearchInput = document.getElementById("wheelSearchInput");
if (wheelSearchInput) {
    wheelSearchInput.addEventListener("input", (e) => {
        loadWheelCandidates(e.target.value.trim());
    });
}


// ------------------------------------------------------------------
// ÇARKI DÖNDÜRME VE KAZANAN FİLMİ SEÇME MANTIĞI
// ------------------------------------------------------------------
let currentWheelRotation = 0; // Çarkın o anki toplam dönüş açısı
let isWheelSpinning = false;  // Çark dönerken tekrar basılmasını önler

const spinBtn = document.getElementById("spinWheelBtn");
if (spinBtn) {
    spinBtn.addEventListener("click", () => {
        // En az 2 film seçilmediyse veya çark zaten dönüyorsa durdur
        if (selectedWheelMovies.length < 2 || isWheelSpinning) return;

        isWheelSpinning = true;
        spinBtn.disabled = true;
        spinBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Dönüyor...`;

        const canvas = document.getElementById("wheelCanvas");

        // En az 5 tam tur (1800 derece) + rastgele bir açı ekle
        const randomExtraDegree = Math.floor(Math.random() * 360);
        const totalSpinDegree = 1800 + randomExtraDegree;
        currentWheelRotation += totalSpinDegree;

        // CSS ile yumuşak ve gerçekçi bir yavaşlama (ease-out) efekti ver
        canvas.style.transition = "transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)";
        canvas.style.transform = `rotate(${currentWheelRotation}deg)`;

        // 4 saniye sonra çark durduğunda kazananı hesapla
        setTimeout(() => {
            isWheelSpinning = false;
            spinBtn.disabled = false;
            spinBtn.innerHTML = `<i class="fa-solid fa-rotate me-2"></i>Tekrar Çevir!`;

            // Üstteki ibrenin (270 derece) tam altına gelen dilimi matematiksel olarak bul
            const sliceAngle = 360 / selectedWheelMovies.length;
            const winningAngle = (270 - (currentWheelRotation % 360) + 360) % 360;
            const winnerIndex = Math.floor(winningAngle / sliceAngle);
            const winner = selectedWheelMovies[winnerIndex];

            // Kazanan filmin afişini, puanını ve ismini şatafatlı pencereye doldur
            const title = winner.title || winner.name || "Film";
            const poster = winner.poster_path ? `${IMAGE_URL}${winner.poster_path}` : "https://via.placeholder.com/300x450?text=Afiş+Yok";
            const year = (winner.release_date || winner.first_air_date || "").split("-")[0] || "";
            const rating = winner.vote_average ? winner.vote_average.toFixed(1) : "N/A";
            const type = winner.media_type === "tv" || winner.first_air_date ? "Dizi" : "Film";

            document.getElementById("wheelWinnerPoster").src = poster;
            document.getElementById("wheelWinnerTitle").innerText = title;
            document.getElementById("wheelWinnerRating").innerText = rating;
            document.getElementById("wheelWinnerYear").innerText = `${year} • ${type}`;

            // "Filmi İncele" butonuna tıklandığında filmin vitrin detayını aç
            const detailBtn = document.getElementById("wheelWinnerDetailBtn");
            detailBtn.onclick = () => {
                bootstrap.Modal.getInstance(document.getElementById("wheelWinnerModal"))?.hide();
                bootstrap.Modal.getInstance(document.getElementById("wheelModal"))?.hide();
                showMovieDetails(winner.id);
            };

            // Şatafatlı kazanan penceresini ekranda parlat!
            new bootstrap.Modal(document.getElementById("wheelWinnerModal")).show();
        }, 4000);
    });
}


// 21. PROFİL & HESAP YÖNETİMİ MANTIĞI

// Profil Penceresi 3'lü Sekme Değiştirme (Profil, Takip Listesi & Hesap Ayarları)
window.switchProfileModalTab = function (activeTabName) {
    const tabProfileBtn = document.getElementById("tabProfileBtn");
    const tabFollowsBtn = document.getElementById("tabFollowsBtn");
    const tabSettingsBtn = document.getElementById("tabSettingsBtn");
    const profileTabContent = document.getElementById("profileTabContent");
    const followsTabContent = document.getElementById("followsTabContent");
    const settingsTabContent = document.getElementById("settingsTabContent");

    [tabProfileBtn, tabFollowsBtn, tabSettingsBtn].forEach(b => {
        if (!b) return;
        b.classList.remove("btn-purple");
        b.classList.add("text-white-50");
    });

    if (profileTabContent) profileTabContent.classList.add("d-none");
    if (followsTabContent) followsTabContent.classList.add("d-none");
    if (settingsTabContent) settingsTabContent.classList.add("d-none");

    if (activeTabName === "profile") {
        tabProfileBtn?.classList.add("btn-purple");
        tabProfileBtn?.classList.remove("text-white-50");
        profileTabContent?.classList.remove("d-none");
    } else if (activeTabName === "follows") {
        tabFollowsBtn?.classList.add("btn-purple");
        tabFollowsBtn?.classList.remove("text-white-50");
        followsTabContent?.classList.remove("d-none");
    } else if (activeTabName === "settings") {
        tabSettingsBtn?.classList.add("btn-purple");
        tabSettingsBtn?.classList.remove("text-white-50");
        settingsTabContent?.classList.remove("d-none");
    }
};

document.getElementById("tabProfileBtn")?.addEventListener("click", () => switchProfileModalTab("profile"));
document.getElementById("tabFollowsBtn")?.addEventListener("click", () => {
    switchProfileModalTab("follows");
    showMyFollowsList("followers");
});
document.getElementById("tabSettingsBtn")?.addEventListener("click", () => switchProfileModalTab("settings"));

// Ortak Kullanıcı Kartı HTML Üreticisi
function renderUsersCardsHtml(uids, emptyMsg = "Kimse bulunamadı.", wrapInCol = false) {
    if (!uids || uids.length === 0) {
        return `
            <div class="${wrapInCol ? 'col-12' : ''} text-center py-4 text-muted small">
                <i class="fa-regular fa-user me-2"></i>${emptyMsg}
            </div>
        `;
    }

    return uids.map(uid => {
        const user = allCommunityUsers.find(u => u.uid === uid) || { uid: uid, username: "Kullanıcı", avatar: defaultAvatars[0], followers: [] };
        const isSelf = currentUser && user.uid === currentUser.uid;
        const isFollowing = currentUserFollowing.includes(user.uid);
        const followerCount = (user.followers && Array.isArray(user.followers)) ? user.followers.length : 0;
        const avatar = user.avatar || defaultAvatars[0];
        const username = user.username || "Kullanıcı";

        const card = `
            <div class="p-2 px-3 rounded bg-dark border-purple d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center gap-3">
                    <img src="${avatar}" class="rounded-circle border-purple" style="width: 42px; height: 42px; object-fit: cover; background: #1a011d;">
                    <div>
                        <div class="fw-bold text-white small d-flex align-items-center gap-2">
                            <span>${username}</span>
                            ${isSelf ? '<span class="badge bg-secondary-purple" style="font-size: 0.65rem;">Sen</span>' : ''}
                        </div>
                        <div class="text-muted" style="font-size: 0.72rem;">
                            <i class="fa-solid fa-users me-1 text-purple"></i>${followerCount} Takipçi
                        </div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-light btn-sm rounded-pill px-3" style="font-size: 0.75rem;" onclick="viewFriendProfile('${user.uid}')">
                        <i class="fa-solid fa-eye me-1"></i>Profili Gör
                    </button>
                    ${!isSelf ? `
                        <button class="btn btn-sm ${isFollowing ? 'btn-outline-danger' : 'btn-purple'} rounded-pill px-3" style="font-size: 0.75rem;" onclick="toggleFollowUser('${user.uid}')">
                            ${isFollowing ? '<i class="fa-solid fa-user-minus me-1"></i>Takipten Çık' : '<i class="fa-solid fa-user-plus me-1"></i>Takip Et'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        return wrapInCol ? `<div class="col-12">${card}</div>` : card;
    }).join("");
}

// Kendi Takip Listemi (Takipçilerim veya Takip Ettiklerim) Gösterme
let currentMyFollowsTab = "followers";
async function showMyFollowsList(type = "followers") {
    currentMyFollowsTab = type;
    const listContainer = document.getElementById("myFollowsUsersList");
    const followersBtn = document.getElementById("myFollowersSubTabBtn");
    const followingBtn = document.getElementById("myFollowingSubTabBtn");

    if (followersBtn && followingBtn) {
        if (type === "followers") {
            followersBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
            followingBtn.className = "btn btn-outline-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
        } else {
            followingBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
            followersBtn.className = "btn btn-outline-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
        }
    }

    if (!listContainer) return;
    listContainer.innerHTML = '<div class="text-center py-4 text-muted small"><i class="fa-solid fa-spinner fa-spin me-2"></i>Yükleniyor...</div>';

    // Kendi takipçi / takip edilen listemizi veritabanından güncel olarak çek.
    // (Topluluk penceresi hiç açılmamış olsa bile liste ve sayılar doğru gelir)
    if (currentUser) {
        try {
            const myDoc = await db.collection("users").doc(currentUser.uid).get();
            const myData = myDoc.exists ? myDoc.data() : {};
            currentUserFollowers = myData.followers || [];
            currentUserFollowing = myData.following || [];
        } catch (err) {
            console.warn("Takip verileri çekilemedi:", err);
        }
    }

    // Liste kartlarında isim ve avatar gösterebilmek için tüm kullanıcıları çek
    if (allCommunityUsers.length === 0) {
        const snap = await db.collection("users").get();
        allCommunityUsers = [];
        snap.forEach(d => allCommunityUsers.push({ uid: d.id, ...d.data() }));
    }

    const followersCountSpan = document.getElementById("myFollowersTabCount");
    const followingCountSpan = document.getElementById("myFollowingTabCount");
    if (followersCountSpan) followersCountSpan.innerText = currentUserFollowers.length;
    if (followingCountSpan) followingCountSpan.innerText = currentUserFollowing.length;

    const targetUids = (type === "followers") ? currentUserFollowers : currentUserFollowing;
    const emptyMsg = (type === "followers") ? "Henüz seni takip eden kimse yok." : "Henüz kimseyi takip etmiyorsun.";

    listContainer.innerHTML = renderUsersCardsHtml(targetUids, emptyMsg, false);
}

document.getElementById("myFollowersSubTabBtn")?.addEventListener("click", () => showMyFollowsList("followers"));
document.getElementById("myFollowingSubTabBtn")?.addEventListener("click", () => showMyFollowsList("following"));

// Profil penceresindeki hazır avatar seçim butonlarını dinamik olarak oluşturur
function renderAvatarPicker() {
    const container = document.getElementById("avatarPickerContainer");
    if (!container) return;
    container.innerHTML = defaultAvatars.map((url, i) => `
        <img src="${url}" class="avatar-choice ${url === currentAvatarUrl ? 'active' : ''}" 
             onclick="selectAvatar('${url}')" alt="Avatar ${i + 1}" title="Avatar ${i + 1}">
    `).join("");
}

// Seçilen avatarı anında Firestore veritabanına kaydeder.
// Böylece kullanıcı "Kaydet" butonuna basmasa ya da oturumunu kapatıp
// tekrar giriş yapsa bile profil fotoğrafı kaybolmaz.
async function saveAvatarToDatabase() {
    if (!currentUser || !currentAvatarUrl) return;
    try {
        await db.collection("users").doc(currentUser.uid).set({
            avatar: currentAvatarUrl
        }, { merge: true });

        // Navbar'daki profil fotoğrafını da anında güncelle
        const navAvatar = document.getElementById("navUserAvatar");
        if (navAvatar) navAvatar.src = currentAvatarUrl;

        showToast("Profil fotoğrafın güncellendi! 📸", "success");
    } catch (error) {
        console.error("Profil fotoğrafı kaydedilemedi:", error);
        showToast("Fotoğraf kaydedilirken hata oluştu: " + error.message, "error");
    }
}

// Bir hazır avatara tıklandığında önizlemeyi anında günceller ve kaydeder
function selectAvatar(url) {
    currentAvatarUrl = url;
    const preview = document.getElementById("profileAvatarPreview");
    if (preview) preview.src = url;
    renderAvatarPicker();
    saveAvatarToDatabase(); // Seçimi anında veritabanına kaydet (kalıcı olsun)
}

// Galeriden/Bilgisayardan Fotoğraf Seçildiğinde Otomatik Sıkıştırıp Yükleme
const avatarInputElem = document.getElementById("avatarFileInput");
if (avatarInputElem) {
    avatarInputElem.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                // Resmi 200x200 boyutuna otomatik küçülterek hafiflet
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round(height * (MAX_SIZE / width));
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round(width * (MAX_SIZE / height));
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // JPEG olarak hafif bir base64 üret (yaklaşık 15-20 KB)
                currentAvatarUrl = canvas.toDataURL("image/jpeg", 0.85);

                const preview = document.getElementById("profileAvatarPreview");
                if (preview) preview.src = currentAvatarUrl;
                document.querySelectorAll(".avatar-choice").forEach(item => item.classList.remove("active"));

                // FOTOĞRAF SEÇİLDİĞİ ANDA otomatik olarak veritabanına kaydet.
                // Böylece kullanıcı "Kaydet" butonuna basmasa ya da oturumunu kapatıp
                // tekrar girse bile profil fotoğrafı kaybolmaz.
                saveAvatarToDatabase();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Ortak Film/Dizi Listelerini Ekrana Basar (Kendi Profilimizdeki Kutu)
async function loadSharedLists() {
    const container = document.getElementById("sharedListsContainer");
    if (!container || !currentUser) return;

    try {
        const snap = await db.collection("sharedLists")
            .where("members", "array-contains", currentUser.uid)
            .get();

        if (snap.empty) {
            container.innerHTML = `
                <div class="text-center py-2 text-muted small">
                    <i class="fa-solid fa-user-group text-purple me-1"></i> Henüz bir arkadaşınızla ortak listeniz yok.
                </div>
            `;
            return;
        }

        let html = '<div class="d-flex flex-column gap-2">';
        snap.forEach(doc => {
            const data = doc.data();
            const otherUid = data.members.find(id => id !== currentUser.uid);
            const otherInfo = data.memberInfo?.[otherUid] || { username: "Arkadaş", avatar: defaultAvatars[0] };
            const toWatchCount = data.toWatch?.length || 0;
            const watchedCount = data.watched?.length || 0;

            html += `
                <div class="p-2 rounded bg-black bg-opacity-25 border-purple d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${otherInfo.avatar}" class="rounded-circle border-purple" style="width: 34px; height: 34px; object-fit: cover;">
                        <div>
                            <div class="fw-bold text-white small">${otherInfo.username} ile Ortak Liste</div>
                            <small class="text-muted" style="font-size: 0.7rem;">${toWatchCount} İzlenecek • ${watchedCount} İzlendi</small>
                        </div>
                    </div>
                    <button class="btn btn-purple btn-sm rounded-pill px-3 py-1 fw-bold" style="font-size: 0.72rem;" onclick="openSharedListWith('${otherUid}')">
                        <i class="fa-solid fa-folder-open me-1"></i>Aç
                    </button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        console.warn("Ortak listeler çekilemedi:", err);
    }
}

// Yeni Ortak Liste Oluştur Butonu Tıklanınca Topluluk Penceresini Aç
const newSharedBtn = document.getElementById("newSharedListBtn");
if (newSharedBtn) {
    newSharedBtn.addEventListener("click", () => {
        bootstrap.Modal.getInstance(document.getElementById("profileModal"))?.hide();
        new bootstrap.Modal(document.getElementById("communityModal")).show();
        loadCommunityUsers();
        showToast("Ortak liste oluşturmak istediğin arkadaşının profiline girip 'Ortak Liste Oluştur' butonuna tıkla! 👥", "info");
    });
}

// Kullanıcının profil bilgilerini, takipçilerini ve film sayılarını yükler
async function loadUserProfileData() {
    if (!currentUser) return;

    // 1. E-posta ve hazır avatarları BEKLETMEDEN ekrana bas
    const email = currentUser.email || "";
    const emailSubtitle = document.getElementById("profileEmailSubtitle");
    const settingsEmail = document.getElementById("settingsEmailText");
    if (emailSubtitle) emailSubtitle.innerText = email;
    if (settingsEmail) settingsEmail.innerText = email;

    renderAvatarPicker();

    // Şifre kutularını temizle
    const oldPassInput = document.getElementById("settingsOldPasswordInput");
    const newPassInput = document.getElementById("settingsNewPasswordInput");
    if (oldPassInput) oldPassInput.value = "";
    if (newPassInput) newPassInput.value = "";

    try {
        const userDoc = await db.collection("users").doc(currentUser.uid).get();
        let userData = userDoc.exists ? userDoc.data() : {};

        // Kullanıcı yeni kayıt olduysa otomatik olarak veritabanına ekle
        if (!userDoc.exists) {
            const initialUsername = currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "Kullanıcı");
            userData = {
                username: initialUsername,
                usernameLower: normalizeUsernameForComparison(initialUsername), // Benzersizlik kontrolü için
                avatar: defaultAvatars[0],
                followers: [],
                following: []
            };
            await db.collection("users").doc(currentUser.uid).set(userData, { merge: true });
        }

        const username = userData.username || currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "Kullanıcı");
        currentAvatarUrl = userData.avatar || currentUser.photoURL || defaultAvatars[0];

        // Navbar'ı güncelle
        const navName = document.getElementById("navUserName");
        const navAvatar = document.getElementById("navUserAvatar");
        if (navName) navName.innerText = username;
        if (navAvatar) navAvatar.src = currentAvatarUrl;

        // Modal içindeki önizleme alanlarını doldur
        const usernameInput = document.getElementById("profileUsernameInput");
        const avatarPreview = document.getElementById("profileAvatarPreview");
        const namePreview = document.getElementById("profileDisplayNamePreview");

        if (usernameInput) usernameInput.value = username;
        if (avatarPreview) avatarPreview.src = currentAvatarUrl;
        if (namePreview) namePreview.innerText = username;
        renderAvatarPicker();

        // Film İstatistiklerini çek (Kaydedilenler & İzlenenler)
        const savedSnap = await db.collection("users").doc(currentUser.uid).collection("savedMovies").get();
        const watchedSnap = await db.collection("users").doc(currentUser.uid).collection("watchedMovies").get();

        const statSaved = document.getElementById("statSavedCount");
        const statWatched = document.getElementById("statWatchedCount");
        if (statSaved) statSaved.innerText = savedSnap.size;
        if (statWatched) statWatched.innerText = watchedSnap.size;

        // Sosyal Takip İstatistikleri (Takipçi ve Takip Edilen)
        const followersCount = userData.followers ? (Array.isArray(userData.followers) ? userData.followers.length : userData.followers) : 0;
        const followingCount = userData.following ? (Array.isArray(userData.following) ? userData.following.length : userData.following) : 0;

        const statFollowers = document.getElementById("statFollowersCount");
        const statFollowing = document.getElementById("statFollowingCount");
        if (statFollowers) statFollowers.innerText = followersCount;
        if (statFollowing) statFollowing.innerText = followingCount;

        // Ortak listeleri yükle
        loadSharedLists();

    } catch (error) {
        console.warn("Profil verisi çekilemedi:", error);
    }
}

// Kullanıcı adını; büyük/küçük harf ve Türkçe İ/I/ı/i harf farklarından bağımsız,
// karşılaştırılabilir tek bir forma indirger. Örn: "Ali", "ALİ", "alı", "ALI" -> "ali"
function normalizeUsernameForComparison(str) {
    return String(str || "")
        .trim()
        .replace(/[İIı]/g, "i")  // Türkçe büyük harf belirsizliğini giderir ("I" hem "ı" hem "i" sanılabilir)
        .toLowerCase()           // Kalan harfleri küçültür (A->a, B->b, ...)
        .replace(/\u0307/g, ""); // "İ" küçültülürken oluşabilen birleştirici noktayı (U+0307) temizler
}

// Kullanıcı adı kuralları (Instagram benzeri profesyonel format):
// - Sadece harf (Türkçe karakterler dahil), rakam ve alt çizgi (_) kullanılabilir
// - Boşluk ve . , - ! @ vb. özel karakterler KABUL EDİLMEZ
const USERNAME_ALLOWED_CHARS = /^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9_]+$/;
const USERNAME_MIN_LENGTH = 3;   // En az 3 karakter
const USERNAME_MAX_LENGTH = 20;  // En fazla 20 karakter

// Kullanıcı adı alanına yazılırken boşluk/özel karakterleri anında temizler (Instagram tarzı)
const usernameInputEl = document.getElementById("profileUsernameInput");
if (usernameInputEl) {
    usernameInputEl.addEventListener("input", () => {
        const cleaned = usernameInputEl.value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ0-9_]/g, "");
        if (cleaned !== usernameInputEl.value) usernameInputEl.value = cleaned;
    });
}

// 1. SEKME FORMU: Sadece Profil Bilgilerini Kaydeder (Kullanıcı Adı ve Avatar)
const profileInfoForm = document.getElementById("profileInfoForm");
if (profileInfoForm) {
    profileInfoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const newUsername = document.getElementById("profileUsernameInput").value.trim();
        const alertBox = document.getElementById("profileInfoAlert");
        const saveBtn = document.getElementById("saveProfileInfoBtn");

        // Boş bırakma kontrolü
        if (!newUsername) {
            alertBox.className = "alert py-2 small text-center mb-2";
            alertBox.style.cssText = "background: rgba(220,53,69,0.15); border: 1px solid rgba(220,53,69,0.5); color: #ff6b6b; border-radius: 10px;";
            alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation me-1"></i>Lütfen bir kullanıcı adı giriniz.`;
            alertBox.classList.remove("d-none");
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Kontrol ediliyor...`;

        try {
            // Kullanıcı adı benzersizlik kontrolü (büyük/küçük harf ve Türkçe karakter fark etmeksizin)
            // NOT: "usernameLower" alanına where sorgusu atmak, bu alana sahip OLMAYAN eski kullanıcıları
            // yakalayamadığı için tüm kullanıcılar çekilip istemci tarafında karşılaştırılıyor.
            const normalizedNewUsername = normalizeUsernameForComparison(newUsername);
            const allUsersSnapshot = await db.collection("users").get();

            // İsim hiç değiştirilmemişse (sadece avatar güncelleniyorsa) format/uzunluk kontrolü atlanır;
            // böylece geçmişte oluşmuş eski usül isimler yalnızca değiştirilmek istendiğinde engellenir.
            const myDoc = allUsersSnapshot.docs.find(doc => doc.id === currentUser.uid);
            const myCurrentUsername = (myDoc ? myDoc.data().username : "") || "";
            const isUsernameUnchanged = myCurrentUsername !== "" && myCurrentUsername === newUsername;

            // FORMAT KONTROLÜ (Instagram benzeri profesyonel kurallar):
            // Sadece harf (Türkçe karakterler dahil), rakam ve alt çizgi (_) kullanılabilir.
            if (!isUsernameUnchanged && !USERNAME_ALLOWED_CHARS.test(newUsername)) {
                alertBox.className = "alert py-2 small text-center mb-2";
                alertBox.style.cssText = "background: rgba(220,53,69,0.15); border: 1px solid rgba(220,53,69,0.5); color: #ff6b6b; border-radius: 10px;";
                alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation me-1"></i>Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) içerebilir. Boşluk ve özel karakterler (. , - !) kabul edilmez.`;
                alertBox.classList.remove("d-none");
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-2"></i>Profil Bilgilerini Kaydet`;
                return;
            }

            // UZUNLUK KONTROLÜ: En az 3, en fazla 20 karakter
            if (!isUsernameUnchanged && (newUsername.length < USERNAME_MIN_LENGTH || newUsername.length > USERNAME_MAX_LENGTH)) {
                alertBox.className = "alert py-2 small text-center mb-2";
                alertBox.style.cssText = "background: rgba(220,53,69,0.15); border: 1px solid rgba(220,53,69,0.5); color: #ff6b6b; border-radius: 10px;";
                alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation me-1"></i>Kullanıcı adı en az ${USERNAME_MIN_LENGTH}, en fazla ${USERNAME_MAX_LENGTH} karakter olmalıdır.`;
                alertBox.classList.remove("d-none");
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-2"></i>Profil Bilgilerini Kaydet`;
                return;
            }

            // Eğer başka birinin aynı kullanıcı adı varsa engelle (kendi hesabımız hariç)
            const alreadyTaken = allUsersSnapshot.docs.some(doc => {
                if (doc.id === currentUser.uid) return false;
                const data = doc.data();
                const existingUsername = data.usernameLower || data.username || "";
                return normalizeUsernameForComparison(existingUsername) === normalizedNewUsername;
            });
            if (alreadyTaken) {
                alertBox.className = "alert py-2 small text-center mb-2";
                alertBox.style.cssText = "background: rgba(220,53,69,0.15); border: 1px solid rgba(220,53,69,0.5); color: #ff6b6b; border-radius: 10px;";
                alertBox.innerHTML = `<i class="fa-solid fa-user-xmark me-1"></i><strong>"${newUsername}"</strong> kullanıcı adı zaten alınmış. Lütfen farklı bir isim deneyin.`;
                alertBox.classList.remove("d-none");
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-2"></i>Profil Bilgilerini Kaydet`;
                return;
            }

            saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Kaydediliyor...`;

            // Firestore veritabanına kullanıcı adı ve avatarı kaydet
            await db.collection("users").doc(currentUser.uid).set({
                username: newUsername,
                usernameLower: normalizeUsernameForComparison(newUsername),  // Büyük/küçük harf kontrolü için
                avatar: currentAvatarUrl
            }, { merge: true });

            // Firebase Auth profilini güncelle (URL 2048 karakterden kısaysa photoURL olarak da kaydet)
            const authProfileUpdates = { displayName: newUsername };
            if (currentAvatarUrl && !currentAvatarUrl.startsWith("data:") && currentAvatarUrl.length < 2048) {
                authProfileUpdates.photoURL = currentAvatarUrl;
            }
            await currentUser.updateProfile(authProfileUpdates);

            // Navbar ve modal önizlemelerini anında güncelle
            const navName = document.getElementById("navUserName");
            const navAvatar = document.getElementById("navUserAvatar");
            const namePreview = document.getElementById("profileDisplayNamePreview");
            const avatarPreview = document.getElementById("profileAvatarPreview");

            if (navName) navName.innerText = newUsername;
            if (navAvatar) navAvatar.src = currentAvatarUrl;
            if (namePreview) namePreview.innerText = newUsername;
            if (avatarPreview) avatarPreview.src = currentAvatarUrl;

            // Başarı mesajı göster (temaya uygun mor/yeşil)
            alertBox.className = "alert py-2 small text-center mb-2";
            alertBox.style.cssText = "background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: #4ade80; border-radius: 10px;";
            alertBox.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>Kullanıcı adınız başarıyla güncellendi!`;
            alertBox.classList.remove("d-none");
            setTimeout(() => alertBox.classList.add("d-none"), 3000);
        } catch (error) {
            alertBox.className = "alert py-2 small text-center mb-2";
            alertBox.style.cssText = "background: rgba(220,53,69,0.15); border: 1px solid rgba(220,53,69,0.5); color: #ff6b6b; border-radius: 10px;";
            alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation me-1"></i>Kaydedilirken hata oluştu: ` + error.message;
            alertBox.classList.remove("d-none");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-2"></i>Profil Bilgilerini Kaydet`;
        }
    });
}

// 2. SEKME FORMU: Sadece Şifreyi Günceller (Eski Şifre Doğrulamasıyla)
const passwordForm = document.getElementById("profilePasswordForm");
if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const oldPassword = document.getElementById("settingsOldPasswordInput").value.trim();
        const newPassword = document.getElementById("settingsNewPasswordInput").value.trim();
        const alertBox = document.getElementById("settingsPasswordAlert");
        const saveBtn = document.getElementById("savePasswordBtn");

        if (!oldPassword) {
            alertBox.className = "alert alert-danger py-2 small text-center mb-2";
            alertBox.innerText = "Lütfen mevcut şifrenizi girin.";
            alertBox.classList.remove("d-none");
            return;
        }

        if (newPassword.length < 6) {
            alertBox.className = "alert alert-danger py-2 small text-center mb-2";
            alertBox.innerText = "Yeni şifre en az 6 karakter olmalıdır.";
            alertBox.classList.remove("d-none");
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Şifre Güncelleniyor...`;

        try {
            // Firebase reauthentication (eski şifre ile güvenlik doğrulaması)
            const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, oldPassword);
            await currentUser.reauthenticateWithCredential(credential);
            await currentUser.updatePassword(newPassword);

            // Başarılı olursa kutuları temizle ve mesaj ver
            document.getElementById("settingsOldPasswordInput").value = "";
            document.getElementById("settingsNewPasswordInput").value = "";

            alertBox.className = "alert alert-success py-2 small text-center mb-2";
            alertBox.innerText = "Şifreniz başarıyla güncellendi!";
            alertBox.classList.remove("d-none");
            setTimeout(() => alertBox.classList.add("d-none"), 3000);
        } catch (error) {
            alertBox.className = "alert alert-danger py-2 small text-center mb-2";
            alertBox.innerText = error.message.includes("auth/wrong-password") || error.message.includes("auth/invalid-credential")
                ? "Mevcut şifreniz hatalı!"
                : error.message;
            alertBox.classList.remove("d-none");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="fa-solid fa-key me-2"></i>Şifreyi Güncelle`;
        }
    });
}

// Dropdown'daki Çıkış Yap Butonu
document.getElementById("dropdownLogoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showConfirmModal({
        title: "Çıkış Yapmak İstediğinize Emin Misiniz?",
        message: "Oturumunuz kapatılacak. Tekrar giriş yaparak tüm içeriklerinize ulaşabilirsiniz.",
        btnText: "Çıkış Yap",
        btnClass: "btn-outline-danger",
        icon: "fa-right-from-bracket text-warning",
        onConfirm: () => auth.signOut()
    });
});

// Profil Modalındaki Çıkış Yap Butonu
document.getElementById("settingsLogoutBtn")?.addEventListener("click", () => {
    showConfirmModal({
        title: "Çıkış Yapmak İstediğinize Emin Misiniz?",
        message: "Oturumunuz kapatılacak. Tekrar giriş yaparak tüm içeriklerinize ulaşabilirsiniz.",
        btnText: "Çıkış Yap",
        btnClass: "btn-outline-danger",
        icon: "fa-right-from-bracket text-warning",
        onConfirm: () => auth.signOut()
    });
});

// Profil penceresi açıldığında verileri tazele
document.getElementById("profileModal").addEventListener("show.bs.modal", loadUserProfileData);

// ==================================================================
// 22. TOPLULUK & ARKADAŞ TAKİP SİSTEMİ
// ==================================================================
let allCommunityUsers = [];       // Veritabanındaki tüm kullanıcılar
let currentUserFollowing = [];     // Bizim takip ettiğimiz kişilerin UID listesi
let currentUserFollowers = [];     // Bizi takip eden kişilerin UID listesi
let currentCommunityTab = "all";   // "all", "followers" veya "following"

// Menüdeki "Topluluk" Linkine Tıklanınca Pencereyi Aç
const communityLink = document.getElementById("communityLink");
if (communityLink) {
    communityLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Topluluğu keşfetmek ve arkadaşlarınızı takip etmek için lütfen önce giriş yapın!");
            new bootstrap.Modal(document.getElementById("authModal")).show();
            return;
        }

        new bootstrap.Modal(document.getElementById("communityModal")).show();
        loadCommunityUsers();
    });
}

// Veritabanından Kullanıcıları ve Takip Ettiklerimizi Yükler
async function loadCommunityUsers() {
    const listContainer = document.getElementById("communityUsersList");
    listContainer.innerHTML = '<div class="text-center py-4 text-muted small"><i class="fa-solid fa-spinner fa-spin me-2"></i>Kullanıcılar yükleniyor...</div>';

    try {
        // 1. Kendi profilimizden takip ettiğimiz kişileri al
        const myDoc = await db.collection("users").doc(currentUser.uid).get();
        const myData = myDoc.exists ? myDoc.data() : {};
        currentUserFollowing = myData.following || [];
        currentUserFollowers = myData.followers || [];

        // 2. Sitedeki tüm kayıtlı kullanıcıları çek
        const snapshot = await db.collection("users").get();
        allCommunityUsers = [];
        snapshot.forEach(doc => {
            allCommunityUsers.push({
                uid: doc.id,
                ...doc.data()
            });
        });

        // Kullanıcıları ekrana çiz
        filterAndRenderCommunity();
    } catch (error) {
        console.warn("Kullanıcılar çekilemedi:", error);
        listContainer.innerHTML = `<div class="text-center py-4 text-danger small"><i class="fa-solid fa-triangle-exclamation me-2"></i>Hata: ${error.message}</div>`;
    }
}

// Kullanıcıları Filtreleyip Ekrana Kartlar Halinde Dizen Fonksiyon
function filterAndRenderCommunity() {
    const searchVal = (document.getElementById("communitySearchInput")?.value || "").toLowerCase().trim();

    let filtered = allCommunityUsers.filter(u => {
        const name = (u.username || "Kullanıcı").toLowerCase();
        return name.includes(searchVal);
    });

    // Sekmeye göre filtrele
    if (currentCommunityTab === "following") {
        filtered = filtered.filter(u => currentUserFollowing.includes(u.uid));
    } else if (currentCommunityTab === "followers") {
        filtered = filtered.filter(u => currentUserFollowers.includes(u.uid));
    }

    renderCommunityUsers(filtered);
}

// Kullanıcı Kartlarını HTML Olarak Ekrana Basar
function renderCommunityUsers(usersToRender) {
    const list = document.getElementById("communityUsersList");
    if (!list) return;

    if (usersToRender.length === 0) {
        list.innerHTML = `
            <div class="text-center py-4 text-muted small">
                <i class="fa-regular fa-user me-2"></i>Eşleşen kullanıcı bulunamadı.
            </div>
        `;
        return;
    }

    list.innerHTML = usersToRender.map(user => {
        const isSelf = user.uid === currentUser.uid;
        const isFollowing = currentUserFollowing.includes(user.uid);
        const followerCount = (user.followers && Array.isArray(user.followers)) ? user.followers.length : 0;
        const avatar = user.avatar || defaultAvatars[0];
        const username = user.username || "Kullanıcı";

        return `
            <div class="p-2 px-3 rounded bg-dark border-purple d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center gap-3">
                    <img src="${avatar}" class="rounded-circle border-purple" style="width: 44px; height: 44px; object-fit: cover; background: #1a011d;">
                    <div>
                        <div class="fw-bold text-white small d-flex align-items-center gap-2">
                            <span>${username}</span>
                            ${isSelf ? '<span class="badge bg-secondary-purple" style="font-size: 0.65rem;">Sen</span>' : ''}
                        </div>
                        <div class="text-muted" style="font-size: 0.72rem;">
                            <i class="fa-solid fa-users me-1 text-purple"></i>${followerCount} Takipçi
                        </div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-light btn-sm rounded-pill px-3" style="font-size: 0.75rem;" onclick="viewFriendProfile('${user.uid}')">
                        <i class="fa-solid fa-eye me-1"></i>Profili Gör
                    </button>
                    ${!isSelf ? `
                        <button class="btn btn-sm ${isFollowing ? 'btn-outline-danger' : 'btn-purple'} rounded-pill px-3" style="font-size: 0.75rem;" onclick="toggleFollowUser('${user.uid}')">
                            ${isFollowing ? '<i class="fa-solid fa-user-minus me-1"></i>Takipten Çık' : '<i class="fa-solid fa-user-plus me-1"></i>Takip Et'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join("");
}

// Canlı Arama Kutusu Dinleyicisi
const communitySearchInput = document.getElementById("communitySearchInput");
if (communitySearchInput) {
    communitySearchInput.addEventListener("input", filterAndRenderCommunity);
}

// Topluluk Sekmeleri: "Herkesi Keşfet", "Takipçilerim" ve "Takip Ettiklerim"
const commTabAllBtn = document.getElementById("communityTabAllBtn");
const commTabFollowersBtn = document.getElementById("communityTabFollowersBtn");
const commTabFollowingBtn = document.getElementById("communityTabFollowingBtn");

function setCommunityActiveTab(activeTab) {
    currentCommunityTab = activeTab;
    if (commTabAllBtn) commTabAllBtn.className = `btn ${activeTab === 'all' ? 'btn-purple' : 'btn-outline-purple'} btn-sm rounded-pill px-3 fw-bold`;
    if (commTabFollowersBtn) commTabFollowersBtn.className = `btn ${activeTab === 'followers' ? 'btn-purple' : 'btn-outline-purple'} btn-sm rounded-pill px-3 fw-bold`;
    if (commTabFollowingBtn) commTabFollowingBtn.className = `btn ${activeTab === 'following' ? 'btn-purple' : 'btn-outline-purple'} btn-sm rounded-pill px-3 fw-bold`;
    filterAndRenderCommunity();
}

if (commTabAllBtn) commTabAllBtn.addEventListener("click", () => setCommunityActiveTab("all"));
if (commTabFollowersBtn) commTabFollowersBtn.addEventListener("click", () => setCommunityActiveTab("followers"));
if (commTabFollowingBtn) commTabFollowingBtn.addEventListener("click", () => setCommunityActiveTab("following"));

// Takip Et / Takipten Çık Fonksiyonu
window.toggleFollowUser = async function (targetUid) {
    if (!currentUser) return;

    const isFollowing = currentUserFollowing.includes(targetUid);
    const myRef = db.collection("users").doc(currentUser.uid);
    const targetRef = db.collection("users").doc(targetUid);

    try {
        if (isFollowing) {
            // Takipten Çık
            await myRef.set({ following: firebase.firestore.FieldValue.arrayRemove(targetUid) }, { merge: true });
            await targetRef.set({ followers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) }, { merge: true });
            currentUserFollowing = currentUserFollowing.filter(id => id !== targetUid);
        } else {
            // Takip Et
            await myRef.set({ following: firebase.firestore.FieldValue.arrayUnion(targetUid) }, { merge: true });
            await targetRef.set({ followers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) }, { merge: true });
            currentUserFollowing.push(targetUid);
        }

        // Kendi profilimizdeki Takip Edilen sayısını anında güncelle
        const followingStat = document.getElementById("statFollowingCount");
        if (followingStat) followingStat.innerText = currentUserFollowing.length;

        // Listeyi yenile
        loadCommunityUsers();
    } catch (err) {
        alert("Takip işlemi sırasında hata oluştu: " + err.message);
    }
};

// ==================================================================
// 23. ARKADAŞ PROFİLİNİ GÖRME VE FİLMLERİNİ KOPYALAMA
// ==================================================================
let currentFriendData = null;
let currentFriendSavedMovies = [];
let currentFriendWatchedMovies = [];
let currentFriendTab = "saved"; // "saved" (kaydettikleri) veya "watched" (izledikleri)
let mySavedMovieIds = []; // Kendi kayıtlı film ID'lerimiz

// Bir kullanıcının "Profili Gör" butonuna tıklandığında çalışır
window.viewFriendProfile = async function (friendUid) {
    // Topluluk penceresini kapatıp arkadaş profilini aç
    bootstrap.Modal.getInstance(document.getElementById("communityModal"))?.hide();
    const modalElem = document.getElementById("friendProfileModal");
    new bootstrap.Modal(modalElem).show();

    const grid = document.getElementById("friendMoviesGrid");
    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted small"><i class="fa-solid fa-spinner fa-spin me-2"></i>Filmler yükleniyor...</div>';

    try {
        // 1. Arkadaşın temel profil bilgilerini çek
        const userDoc = await db.collection("users").doc(friendUid).get();
        currentFriendData = { uid: friendUid, ...(userDoc.exists ? userDoc.data() : {}) };

        const name = currentFriendData.username || "Kullanıcı";
        const avatar = currentFriendData.avatar || defaultAvatars[0];
        const followers = currentFriendData.followers || [];
        const following = currentFriendData.following || [];

        // Başlık ve kart bilgilerini doldur
        document.getElementById("friendAvatar").src = avatar;
        document.getElementById("friendUsername").innerText = name;
        document.getElementById("friendProfileTitle").innerHTML = `<i class="fa-solid fa-user text-purple me-2"></i>${name} Profili`;
        document.getElementById("friendStatFollowers").innerText = followers.length;
        document.getElementById("friendStatFollowing").innerText = following.length;

        // Takip Et Butonunu Ayarla
        const followWrapper = document.getElementById("friendFollowBtnWrapper");
        const isSelf = currentUser && currentUser.uid === friendUid;
        const isFollowing = currentUserFollowing.includes(friendUid);

        if (isSelf) {
            followWrapper.innerHTML = `<span class="badge bg-secondary-purple">Bu senin profilin</span>`;
        } else {
            followWrapper.innerHTML = `
                <div class="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                    <button class="btn btn-sm ${isFollowing ? 'btn-outline-danger' : 'btn-purple'} rounded-pill px-4 fw-bold" 
                           onclick="toggleFollowFriend('${friendUid}')">
                        ${isFollowing ? '<i class="fa-solid fa-user-minus me-1"></i>Takipten Çık' : '<i class="fa-solid fa-user-plus me-1"></i>Takip Et'}
                    </button>
                    <button class="btn btn-sm btn-outline-purple rounded-pill px-3 fw-bold" 
                           onclick="openSharedListWith('${friendUid}')">
                        <i class="fa-solid fa-user-group me-1"></i>Ortak Liste Oluştur
                    </button>
                </div>
            `;
        }

        // 2. Arkadaşın Kaydedilen ve İzlenen filmlerini Firebase'den çek
        const savedSnap = await db.collection("users").doc(friendUid).collection("savedMovies").get();
        const watchedSnap = await db.collection("users").doc(friendUid).collection("watchedMovies").get();

        currentFriendSavedMovies = [];
        savedSnap.forEach(d => currentFriendSavedMovies.push(d.data()));

        currentFriendWatchedMovies = [];
        watchedSnap.forEach(d => currentFriendWatchedMovies.push(d.data()));



        // Kendi kaydettiğimiz filmlerin ID'lerini çek (arkadaşın filmleriyle karşılaştırmak için)
        mySavedMovieIds = [];
        if (currentUser) {
            const mySnap = await db.collection("users").doc(currentUser.uid).collection("savedMovies").get();
            mySnap.forEach(d => mySavedMovieIds.push(String(d.id)));
        }

        // Varsayılan olarak "Kaydettiği Filmler" sekmesini ekrana bas
        currentFriendTab = "saved";
        renderFriendMovies();
    } catch (err) {
        grid.innerHTML = `<div class="col-12 text-center py-4 text-danger small">Filmler yüklenirken hata oluştu: ${err.message}</div>`;
    }
};

// Arkadaşın Filmlerini Ekrana Kartlar Halinde Dizer
function renderFriendMovies() {
    const grid = document.getElementById("friendMoviesGrid");
    const movies = (currentFriendTab === "saved") ? currentFriendSavedMovies : currentFriendWatchedMovies;
    const tabName = (currentFriendTab === "saved") ? "kaydedilen" : "izlenen";

    if (movies.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-4 text-muted small">
                <i class="fa-regular fa-folder-open me-2"></i>Bu kullanıcının henüz ${tabName} filmi yok.
            </div>
        `;
        return;
    }

    grid.innerHTML = movies.map(movie => {
        const poster = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : "https://via.placeholder.com/300x450?text=Afiş+Yok";
        const title = movie.title || movie.name || "Film";
        const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "";
        const rating = (typeof movie.vote_average === "number") ? movie.vote_average.toFixed(1) : (movie.vote_average || "N/A");

        return `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card bg-dark border-purple h-100 rounded-3 overflow-hidden shadow-sm position-relative">
                    <img src="${poster}" class="card-img-top" style="height: 170px; object-fit: cover;" alt="${title}">
                    <span class="position-absolute top-0 end-0 badge bg-warning text-dark m-1" style="font-size: 0.65rem;">
                        <i class="fa-solid fa-star me-1"></i>${rating}
                    </span>
                                       <!-- Eğer Arkadaşın Favorisine Eklediyse Kırmızı Kalp Rozeti -->
                    ${movie.isFavorite ? `
                        <span class="position-absolute top-0 start-0 badge bg-danger m-1 shadow" style="font-size: 0.65rem;">
                            <i class="fa-solid fa-heart me-1"></i>Favori
                        </span>
                    ` : ''}

                    <div class="p-2 d-flex flex-column justify-content-between flex-grow-1">
                        <div>
                            <div class="fw-bold text-white small text-truncate" title="${title}">${title}</div>
                            <small class="text-muted" style="font-size: 0.7rem;">${year}</small>
                            
                            <!-- Arkadaşın Verdiği Puan -->
                            ${movie.userRating ? `
                                <div class="text-warning small fw-bold mt-1" style="font-size: 0.72rem;">
                                    <i class="fa-solid fa-star me-1"></i>Puanı: ${movie.userRating}/10
                                </div>
                            ` : ''}

                            <!-- Arkadaşın Yaptığı Yorum -->
                            ${movie.userReview ? `
                                <div class="p-1 px-2 rounded bg-black bg-opacity-50 text-white-50 mt-1 fst-italic" style="font-size: 0.68rem; line-height: 1.2;" title="${movie.userReview}">
                                    <i class="fa-solid fa-quote-left text-purple me-1"></i>"${movie.userReview}"
                                </div>
                            ` : ''}
                        </div>
                      ${(currentUser && currentFriendData && currentFriendData.uid === currentUser.uid) ? '' : (
                mySavedMovieIds.includes(String(movie.id)) ? `
        <div class="text-center text-muted small mt-2 py-1" style="font-size: 0.72rem;">
            <i class="fa-solid fa-check text-success me-1"></i>Listenizde
        </div>
    ` : `
        <button class="btn btn-outline-purple btn-sm rounded-pill w-100 mt-2 py-1" 
                style="font-size: 0.7rem;" 
                id="copyBtn_${movie.id}"
                onclick="copyMovieToMyList('${movie.id}')">
            <i class="fa-solid fa-plus me-1"></i>Listeme Ekle
        </button>
    `
            )}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Arkadaş Profilinde Sekme Değiştirme (Kaydedilen, İzlenen, Takipçiler, Takip Edilenler)
window.renderFriendTab = function (tabName) {
    currentFriendTab = tabName;
    const grid = document.getElementById("friendMoviesGrid");
    const savedBtn = document.getElementById("friendTabSavedBtn");
    const watchedBtn = document.getElementById("friendTabWatchedBtn");
    const followersBtn = document.getElementById("friendTabFollowersBtn");
    const followingBtn = document.getElementById("friendTabFollowingBtn");

    [savedBtn, watchedBtn, followersBtn, followingBtn].forEach(b => {
        if (!b) return;
        b.className = "btn btn-outline-purple btn-sm rounded-pill px-3 fw-bold";
    });

    if (tabName === "saved") {
        if (savedBtn) savedBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold";
        renderFriendMovies();
    } else if (tabName === "watched") {
        if (watchedBtn) watchedBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold";
        renderFriendMovies();
    } else if (tabName === "followers") {
        if (followersBtn) followersBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold";
        const followers = currentFriendData?.followers || [];
        grid.innerHTML = renderUsersCardsHtml(followers, "Bu kullanıcıyı henüz takip eden kimse yok.", true);
    } else if (tabName === "following") {
        if (followingBtn) followingBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold";
        const following = currentFriendData?.following || [];
        grid.innerHTML = renderUsersCardsHtml(following, "Bu kullanıcı henüz kimseyi takip etmiyor.", true);
    }
};

document.getElementById("friendTabSavedBtn")?.addEventListener("click", () => renderFriendTab("saved"));
document.getElementById("friendTabWatchedBtn")?.addEventListener("click", () => renderFriendTab("watched"));
document.getElementById("friendTabFollowersBtn")?.addEventListener("click", () => renderFriendTab("followers"));
document.getElementById("friendTabFollowingBtn")?.addEventListener("click", () => renderFriendTab("following"));
document.getElementById("friendStatBoxFollowers")?.addEventListener("click", () => renderFriendTab("followers"));
document.getElementById("friendStatBoxFollowing")?.addEventListener("click", () => renderFriendTab("following"));

// Şık Kayan Bildirimi (Toast) Ekranda Gösteren Yardımcı Fonksiyon
function showToast(message, type = "success") {
    const toast = document.getElementById("customToast");
    const icon = document.getElementById("customToastIcon");
    const text = document.getElementById("customToastMessage");
    if (!toast) return;

    text.innerText = message;

    if (type === "warning") {
        icon.className = "fa-solid fa-triangle-exclamation text-warning fs-5";
        toast.style.borderColor = "#f1c40f";
    } else if (type === "error") {
        icon.className = "fa-solid fa-circle-xmark text-danger fs-5";
        toast.style.borderColor = "#ff4757";
    } else {
        icon.className = "fa-solid fa-circle-check text-success fs-5";
        toast.style.borderColor = "var(--accent-purple)";
    }

    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

// Arkadaşın Sayfasındaki Bir Filmi Akıllıca Kendi Listeme Ekleme
window.copyMovieToMyList = async function (movieId) {
    if (!currentUser) {
        showToast("Filmi eklemek için lütfen giriş yapın!", "warning");
        return;
    }

    const movie = (currentFriendTab === "saved" ? currentFriendSavedMovies : currentFriendWatchedMovies).find(m => String(m.id) === String(movieId));
    if (!movie) return;

    try {
        const movieRef = db.collection("users").doc(currentUser.uid).collection("savedMovies").doc(String(movie.id));
        const docSnap = await movieRef.get();

        // 1. Durum: Film bizde zaten varsa uyarı ver
        if (docSnap.exists) {
            showToast(`"${movie.title || movie.name}" zaten listenizde bulunuyor!`, "warning");
        }
        // 2. Durum: Film bizde yoksa kaydet ve şık yeşil onay ver
        else {
            await movieRef.set(movie);
            mySavedMovieIds.push(String(movie.id));
            const copyBtn = document.getElementById(`copyBtn_${movie.id}`);
            if (copyBtn) {
                copyBtn.outerHTML = `<div class="text-center text-muted small mt-2 py-1" style="font-size: 0.72rem;"><i class="fa-solid fa-check text-success me-1"></i>Listenizde</div>`;
            }
            showToast(`"${movie.title || movie.name}" listenize eklendi! ✨`, "success");
        }
    } catch (err) {
        showToast("Eklenirken hata oluştu: " + err.message, "error");
    }
};

// Arkadaş Profilindeyken Takip Et / Takipten Çık Yapınca Sayfayı Karartmadan Günceller
window.toggleFollowFriend = async function (friendUid) {
    await toggleFollowUser(friendUid);

    // Modalı baştan açmadan sadece butonu güncelle
    const isFollowing = currentUserFollowing.includes(friendUid);
    const followWrapper = document.getElementById("friendFollowBtnWrapper");
    if (followWrapper) {
        followWrapper.innerHTML = `
            <div class="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                <button class="btn btn-sm ${isFollowing ? 'btn-outline-danger' : 'btn-purple'} rounded-pill px-4 fw-bold" 
                        onclick="toggleFollowFriend('${friendUid}')">
                    ${isFollowing ? '<i class="fa-solid fa-user-minus me-1"></i>Takipten Çık' : '<i class="fa-solid fa-user-plus me-1"></i>Takip Et'}
                </button>
                <button class="btn btn-sm btn-outline-purple rounded-pill px-3 fw-bold" 
                        onclick="openSharedListWith('${friendUid}')">
                    <i class="fa-solid fa-user-group me-1"></i>Ortak Liste Oluştur
                </button>
            </div>
        `;
    }

    // Arkadaşın takipçi sayısını ekranda anında 1 artır veya azalt
    const statFollowers = document.getElementById("friendStatFollowers");
    if (statFollowers) {
        const currentCount = parseInt(statFollowers.innerText) || 0;
        statFollowers.innerText = isFollowing ? (currentCount + 1) : Math.max(0, currentCount - 1);
    }
};

// Arkadaş Profili Kapanınca Arkadaki Siyah Perdeleri Tamamen Temizle
document.getElementById("friendProfileModal")?.addEventListener("hidden.bs.modal", () => {
    document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
});

// Kaydedilenler veya İzlenenler Listesinden Filmi Hızlıca Siler
window.removeMovieFromList = async function (event, movieId) {
    event.stopPropagation(); // Kartın tıklanıp detay sayfasının açılmasını engeller

    if (!currentUser || !currentView) return;

    try {
        // Firebase'den sil
        await db.collection("users").doc(currentUser.uid).collection(currentView).doc(String(movieId)).delete();

        // Ekrandaki listeden de anında düşür
        currentUserMovies = currentUserMovies.filter(m => String(m.id) !== String(movieId));

        // Eğer listede hiç film kalmadıysa boş klasör uyarısı ver
        if (currentUserMovies.length === 0) {
            document.getElementById("popularMoviesGrid").innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <h5><i class="fa-regular fa-folder-open me-2"></i>Bu listede henüz hiç film bulunmuyor.</h5>
                </div>
            `;
        } else {
            displayMovies(currentUserMovies);
        }

    } catch (err) {
        showToast("Silinirken hata oluştu: " + err.message, "error");
    }
};

// ==================================================================
// PROFİLDEKİ 4 İSTATİSTİK KUTUSUNA TIKLANINCA İLGİLİ SAYFAYI AÇMA
// ==================================================================

// "Kaydedilenler" kutusuna tıklanınca
document.getElementById("boxStatSaved")?.addEventListener("click", () => {
    bootstrap.Modal.getInstance(document.getElementById("profileModal"))?.hide();
    loadUserMovies("savedMovies", "Kaydettiğim İçerikler", "fa-solid fa-bookmark");
});

// "İzlenenler" kutusuna tıklanınca
document.getElementById("boxStatWatched")?.addEventListener("click", () => {
    bootstrap.Modal.getInstance(document.getElementById("profileModal"))?.hide();
    loadUserMovies("watchedMovies", "İzlediğim İçerikler", "fa-solid fa-eye");
});

// "Takipçiler" kutusuna tıklanınca: Kendi Profil penceremizin içindeki "Takip Listesi" sekmesini aç
document.getElementById("boxStatFollowers")?.addEventListener("click", () => {
    switchProfileModalTab("follows");
    showMyFollowsList("followers");
});

// "Takip Edilenler" kutusuna tıklanınca: Kendi Profil penceremizin içindeki "Takip Listesi" sekmesini aç
document.getElementById("boxStatFollowing")?.addEventListener("click", () => {
    switchProfileModalTab("follows");
    showMyFollowsList("following");
});


// ==================================================================
// 24. FİLM DEĞERLENDİRME, PUANLAMA (1-10) VE YORUM SİSTEMİ
// ==================================================================
let activeReviewMovie = null;
let currentSelectedRating = 0;
let currentIsFavorite = false;

// Puanlama Modalı Açıldığında Çalışır
window.openMovieReviewModal = function (e, movieId) {
    if (e) e.stopPropagation(); // Kart tıklanıp film detayına gitmesin diye durduruyoruz

    activeReviewMovie = currentUserMovies.find(m => String(m.id) === String(movieId));
    if (!activeReviewMovie) return;

    currentSelectedRating = activeReviewMovie.userRating || 0;
    currentIsFavorite = activeReviewMovie.isFavorite || false;

    // Başlık ve Yıl
    document.getElementById("reviewMovieName").innerText = activeReviewMovie.title || activeReviewMovie.name || "Film";
    document.getElementById("reviewMovieYear").innerText = (activeReviewMovie.release_date || activeReviewMovie.first_air_date || "").split("-")[0] || "";
    document.getElementById("movieReviewComment").value = activeReviewMovie.userReview || "";

    // 1-10 Arası Butonları Çiz
    renderRatingButtons();

    // Favori Butonunun Durumunu Güncelle
    updateFavoriteBtnUI();

    // Modalı Aç
    new bootstrap.Modal(document.getElementById("movieReviewModal")).show();
};

// 1'den 10'a Kadar Puan Butonlarını Oluşturur
function renderRatingButtons() {
    const container = document.getElementById("ratingButtonsContainer");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        const isSelected = (currentSelectedRating === i);
        btn.className = `btn btn-sm ${isSelected ? 'btn-purple text-white shadow' : 'btn-dark border-secondary text-white-50'} rounded-circle fw-bold`;
        btn.style.width = "34px";
        btn.style.height = "34px";
        btn.style.padding = "0";
        btn.style.fontSize = "0.8rem";
        btn.innerText = i;
        btn.onclick = () => {
            currentSelectedRating = i;
            renderRatingButtons();
        };
        container.appendChild(btn);
    }
}

// Favori Butonunun Rengini ve İkonunu Değiştirir
function updateFavoriteBtnUI() {
    const btn = document.getElementById("reviewFavoriteToggleBtn");
    const icon = document.getElementById("reviewFavoriteIcon");
    const text = document.getElementById("reviewFavoriteText");
    if (!btn || !icon || !text) return;

    if (currentIsFavorite) {
        btn.className = "btn btn-danger btn-sm rounded-pill px-3 fw-bold";
        icon.className = "fa-solid fa-heart me-1";
        text.innerText = "Favorilerimde ❤️";
    } else {
        btn.className = "btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold";
        icon.className = "fa-regular fa-heart me-1";
        text.innerText = "Favorilere Ekle";
    }
}

// Favori Butonuna Tıklanınca Durumu Değiştir
document.getElementById("reviewFavoriteToggleBtn")?.addEventListener("click", () => {
    currentIsFavorite = !currentIsFavorite;
    updateFavoriteBtnUI();
});

// "Değerlendirmeyi Kaydet" Butonuna Tıklanınca Firebase'e Kaydet
document.getElementById("saveReviewBtn")?.addEventListener("click", async () => {
    if (!currentUser || !activeReviewMovie) return;

    const comment = document.getElementById("movieReviewComment").value.trim();

    try {
        // Firestore'a puanı, yorumu ve favori bilgisini birleştirerek (merge) kaydet
        await db.collection("users").doc(currentUser.uid).collection("watchedMovies").doc(String(activeReviewMovie.id)).set({
            userRating: currentSelectedRating || null,
            userReview: comment || "",
            isFavorite: currentIsFavorite
        }, { merge: true });

        // Yerel hafızadaki film nesnesini de güncelle ki ekranda anında gözüksün
        activeReviewMovie.userRating = currentSelectedRating || null;
        activeReviewMovie.userReview = comment || "";
        activeReviewMovie.isFavorite = currentIsFavorite;

        // Ekranı güncelle
        displayMovies(currentUserMovies);

        // Modalı kapat ve başarı bildirimi ver
        bootstrap.Modal.getInstance(document.getElementById("movieReviewModal"))?.hide();
        showToast("Değerlendirmeniz başarıyla kaydedildi! ⭐", "success");
    } catch (err) {
        showToast("Kaydedilirken hata oluştu: " + err.message, "error");
    }
});

// ==================================================================
// 25. ORTAK FİLM LİSTESİ SİSTEMİ (BİRLİKTE İZLENECEKLER & İZLENENLER)
// ==================================================================
let activeSharedListId = null;
let activeSharedTargetUid = null;
let activeSharedListData = null;
let activeSharedTab = "toWatch"; // "toWatch" veya "watched"
let activeSharedReviewMovieId = null;
let currentSharedSelectedRating = 0;
let currentSharedIsFavorite = false;

// Arkadaşla Ortak Listeyi Açar veya Yoksa Oluşturur
window.openSharedListWith = async function (targetUid) {
    if (!currentUser) return;

    // Açık olan diğer pencereleri kapat
    bootstrap.Modal.getInstance(document.getElementById("friendProfileModal"))?.hide();
    bootstrap.Modal.getInstance(document.getElementById("profileModal"))?.hide();
    bootstrap.Modal.getInstance(document.getElementById("communityModal"))?.hide();

    // İki kullanıcının UID'sini sıralı birleştirip benzersiz ID oluştur
    activeSharedTargetUid = targetUid;
    activeSharedListId = [currentUser.uid, targetUid].sort().join("_");

    const modalElem = document.getElementById("sharedListModal");
    new bootstrap.Modal(modalElem).show();

    const grid = document.getElementById("sharedMoviesGrid");
    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted small"><i class="fa-solid fa-spinner fa-spin me-2"></i>Ortak liste yükleniyor...</div>';

    try {
        // İki kullanıcının da bilgilerini çek
        const myDoc = await db.collection("users").doc(currentUser.uid).get();
        const friendDoc = await db.collection("users").doc(targetUid).get();

        const myData = myDoc.exists ? myDoc.data() : {};
        const friendData = friendDoc.exists ? friendDoc.data() : {};

        const myName = myData.username || "Sen";
        const myAvatar = myData.avatar || defaultAvatars[0];
        const friendName = friendData.username || "Arkadaş";
        const friendAvatar = friendData.avatar || defaultAvatars[0];

        // Modal başlığı ve avatarları doldur
        document.getElementById("sharedUser1Avatar").src = myAvatar;
        document.getElementById("sharedUser1Name").innerText = myName;
        document.getElementById("sharedUser2Avatar").src = friendAvatar;
        document.getElementById("sharedUser2Name").innerText = friendName;
        document.getElementById("sharedListTitle").innerHTML = `<i class="fa-solid fa-users text-purple me-2"></i>${friendName} ile Ortak Liste`;

        // Firestore'dan ortak listeyi çek
        const docRef = db.collection("sharedLists").doc(activeSharedListId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            activeSharedListData = docSnap.data();
        } else {
            // İlk kez ortak liste oluşturuluyor
            activeSharedListData = {
                id: activeSharedListId,
                members: [currentUser.uid, targetUid],
                memberInfo: {
                    [currentUser.uid]: { username: myName, avatar: myAvatar },
                    [targetUid]: { username: friendName, avatar: friendAvatar }
                },
                toWatch: [],
                watched: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await docRef.set(activeSharedListData);
            showToast(`${friendName} ile ortak listeniz oluşturuldu! 🎉`, "success");
        }

        activeSharedTab = "toWatch";
        renderSharedListUI();
        loadSharedLists(); // Kendi profilimizdeki kutuyu da güncelle
    } catch (err) {
        grid.innerHTML = `<div class="col-12 text-center py-4 text-danger small">Ortak liste açılırken hata oluştu: ${err.message}</div>`;
    }
};

// Ortak Listenin İçeriğini ve Sekmelerini Ekrana Çizer
function renderSharedListUI() {
    if (!activeSharedListData) return;

    const toWatchList = activeSharedListData.toWatch || [];
    const watchedList = activeSharedListData.watched || [];

    // Sayaçları güncelle
    const toWatchCount = document.getElementById("sharedToWatchCount");
    const watchedCount = document.getElementById("sharedWatchedCount");
    const subInfo = document.getElementById("sharedListSubInfo");
    if (toWatchCount) toWatchCount.innerText = toWatchList.length;
    if (watchedCount) watchedCount.innerText = watchedList.length;
    if (subInfo) subInfo.innerText = `${toWatchList.length} Birlikte İzlenecek • ${watchedList.length} Birlikte İzlendi`;

    // Sekme buton stilleri
    const toWatchBtn = document.getElementById("sharedTabToWatchBtn");
    const watchedBtn = document.getElementById("sharedTabWatchedBtn");
    if (toWatchBtn && watchedBtn) {
        if (activeSharedTab === "toWatch") {
            toWatchBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
            watchedBtn.className = "btn btn-outline-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
        } else {
            watchedBtn.className = "btn btn-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
            toWatchBtn.className = "btn btn-outline-purple btn-sm rounded-pill px-3 fw-bold flex-fill";
        }
    }

    const grid = document.getElementById("sharedMoviesGrid");
    if (!grid) return;

    const friendInfo = activeSharedListData.memberInfo?.[activeSharedTargetUid] || { username: "Arkadaş" };
    const friendName = friendInfo.username;

    // 1. SEKME: BİRLİKTE İZLEYECEKLERİMİZ
    if (activeSharedTab === "toWatch") {
        if (toWatchList.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5 text-muted small">
                    <i class="fa-regular fa-folder-open me-2 fs-4 d-block mb-2 text-purple"></i>
                    Henüz birlikte izlenecek bir film eklemediniz.<br>
                    Yukarıdaki arama çubuğundan film veya dizi arayıp ortak listenize ekleyebilirsiniz! 🍿
                </div>
            `;
            return;
        }

        grid.innerHTML = toWatchList.map(movie => {
            const poster = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : "https://via.placeholder.com/300x450?text=Afiş+Yok";
            const title = movie.title || movie.name || "Film";
            const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "";
            const rating = (typeof movie.vote_average === "number") ? movie.vote_average.toFixed(1) : (movie.vote_average || "N/A");
            const addedBy = movie.addedByName || "Biri";

            return `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="card bg-dark border-purple h-100 rounded-3 overflow-hidden shadow-sm position-relative">
                        <img src="${poster}" class="card-img-top" style="height: 170px; object-fit: cover;" alt="${title}">
                        <span class="position-absolute top-0 end-0 badge bg-warning text-dark m-1" style="font-size: 0.65rem;">
                            <i class="fa-solid fa-star me-1"></i>${rating}
                        </span>
                        <span class="position-absolute top-0 start-0 badge bg-black bg-opacity-75 text-white-50 m-1" style="font-size: 0.62rem;">
                            Öneren: ${addedBy}
                        </span>
                        <div class="p-2 d-flex flex-column justify-content-between flex-grow-1">
                            <div>
                                <div class="fw-bold text-white small text-truncate" title="${title}">${title}</div>
                                <small class="text-muted" style="font-size: 0.7rem;">${year}</small>
                            </div>
                            <div class="mt-2 d-flex flex-column gap-1">
                                <button class="btn btn-success btn-sm rounded-pill w-100 py-1" style="font-size: 0.7rem;" onclick="markSharedMovieWatched('${movie.id}')">
                                    <i class="fa-solid fa-check me-1"></i>Birlikte İzledik
                                </button>
                                <button class="btn btn-outline-danger btn-sm rounded-pill w-100 py-0" style="font-size: 0.65rem;" onclick="removeSharedMovie('${movie.id}', 'toWatch')">
                                    Listeden Kaldır
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }
    // 2. SEKME: BİRLİKTE İZLEDİKLERİMİZ
    else {
        if (watchedList.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5 text-muted small">
                    <i class="fa-solid fa-film me-2 fs-4 d-block mb-2 text-purple"></i>
                    Henüz birlikte izlediğiniz bir film yok.<br>
                    İzleyeceğiniz filmi bitirdiğinizde "Birlikte İzledik" butonuna basarak buraya taşıyabilirsiniz!
                </div>
            `;
            return;
        }

        grid.innerHTML = watchedList.map(movie => {
            const poster = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : "https://via.placeholder.com/300x450?text=Afiş+Yok";
            const title = movie.title || movie.name || "Film";
            const year = (movie.release_date || movie.first_air_date || "").split("-")[0] || "";

            // Puanlar
            const myRating = movie.ratings?.[currentUser.uid];
            const friendRating = movie.ratings?.[activeSharedTargetUid];
            let avgRating = null;
            if (myRating && friendRating) {
                avgRating = ((myRating + friendRating) / 2).toFixed(1);
            }

            // Favoriler
            const myFav = movie.favorites?.includes(currentUser.uid);
            const friendFav = movie.favorites?.includes(activeSharedTargetUid);
            const bothFav = myFav && friendFav;

            // Yorumlar
            const myReview = movie.reviews?.[currentUser.uid];
            const friendReview = movie.reviews?.[activeSharedTargetUid];

            return `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="card bg-dark border-purple h-100 rounded-3 overflow-hidden shadow-sm position-relative">
                        <img src="${poster}" class="card-img-top" style="height: 170px; object-fit: cover;" alt="${title}">
                        
                        ${bothFav ? `
                            <span class="position-absolute top-0 start-0 badge bg-danger m-1 shadow" style="font-size: 0.65rem;">
                                <i class="fa-solid fa-fire me-1"></i>İkimizin de Favorisi! 🔥
                            </span>
                        ` : (myFav || friendFav) ? `
                            <span class="position-absolute top-0 start-0 badge bg-secondary-purple m-1 shadow" style="font-size: 0.65rem;">
                                <i class="fa-solid fa-heart me-1"></i>${myFav ? 'Favorin' : friendName + '\'ın Favorisi'}
                            </span>
                        ` : ''}

                        ${avgRating ? `
                            <span class="position-absolute top-0 end-0 badge bg-warning text-dark m-1 shadow fw-bold" style="font-size: 0.65rem;">
                                <i class="fa-solid fa-star me-1"></i>Ortak: ${avgRating}
                            </span>
                        ` : ''}

                        <div class="p-2 d-flex flex-column justify-content-between flex-grow-1">
                            <div>
                                <div class="fw-bold text-white small text-truncate" title="${title}">${title}</div>
                                <small class="text-muted" style="font-size: 0.7rem;">${year}</small>

                                <!-- Puan Özeti -->
                                <div class="mt-1 pt-1 border-top border-secondary">
                                    <div class="text-white-50" style="font-size: 0.68rem;">
                                        Sen: <strong class="text-warning">${myRating ? '⭐ ' + myRating + '/10' : '—'}</strong> • 
                                        ${friendName}: <strong class="text-warning">${friendRating ? '⭐ ' + friendRating + '/10' : '—'}</strong>
                                    </div>
                                </div>

                                <!-- Karşılıklı Yorumlar -->
                                ${myReview ? `
                                    <div class="p-1 px-2 rounded bg-black bg-opacity-50 text-white-50 mt-1 small fst-italic" style="font-size: 0.66rem; line-height: 1.2;">
                                        <i class="fa-solid fa-comment me-1 text-purple"></i><strong>Sen:</strong> "${myReview}"
                                    </div>
                                ` : ''}

                                ${friendReview ? `
                                    <div class="p-1 px-2 rounded bg-black bg-opacity-50 text-white-50 mt-1 small fst-italic" style="font-size: 0.66rem; line-height: 1.2;">
                                        <i class="fa-solid fa-comment me-1 text-info"></i><strong>${friendName}:</strong> "${friendReview}"
                                    </div>
                                ` : ''}
                            </div>

                            <div class="mt-2 d-flex flex-column gap-1">
                                <button class="btn btn-outline-purple btn-sm rounded-pill w-100 py-1" style="font-size: 0.7rem;" onclick="openSharedReviewModal('${movie.id}')">
                                    <i class="fa-solid fa-pen-to-square me-1"></i>${myRating || myReview ? 'Puanını / Yorumunu Düzenle' : 'Puanla & Yorum Yap'}
                                </button>
                                <button class="btn btn-outline-danger btn-sm rounded-pill w-100 py-0" style="font-size: 0.65rem;" onclick="removeSharedMovie('${movie.id}', 'watched')">
                                    Listeden Kaldır
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }
}

// Sekme Değiştirme Dinleyicileri
document.getElementById("sharedTabToWatchBtn")?.addEventListener("click", () => {
    activeSharedTab = "toWatch";
    renderSharedListUI();
});
document.getElementById("sharedTabWatchedBtn")?.addEventListener("click", () => {
    activeSharedTab = "watched";
    renderSharedListUI();
});

// Ortak Listeye Film Arama (TMDB API)
let sharedSearchTimeout = null;
const sharedSearchInput = document.getElementById("sharedMovieSearchInput");
const sharedSearchResults = document.getElementById("sharedMovieSearchResults");

if (sharedSearchInput && sharedSearchResults) {
    sharedSearchInput.addEventListener("input", () => {
        clearTimeout(sharedSearchTimeout);
        const query = sharedSearchInput.value.trim();

        if (query.length < 2) {
            sharedSearchResults.classList.add("d-none");
            sharedSearchResults.innerHTML = "";
            return;
        }

        sharedSearchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}`);
                const data = await res.json();
                const results = (data.results || []).filter(item => (item.media_type === "movie" || item.media_type === "tv") && item.poster_path).slice(0, 5);

                if (results.length === 0) {
                    sharedSearchResults.innerHTML = '<div class="p-3 text-center text-muted small">Eşleşen film veya dizi bulunamadı.</div>';
                    sharedSearchResults.classList.remove("d-none");
                    return;
                }

                sharedSearchResults.innerHTML = results.map(item => {
                    const poster = `${IMAGE_URL}${item.poster_path}`;
                    const title = item.title || item.name || "İçerik";
                    const year = (item.release_date || item.first_air_date || "").split("-")[0] || "";
                    const type = item.media_type === "tv" ? "Dizi" : "Film";

                    return `
                        <div class="shared-search-item" onclick="addMovieToSharedList(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <img src="${poster}" class="rounded" style="width: 32px; height: 46px; object-fit: cover;">
                            <div class="flex-grow-1 text-start">
                                <div class="fw-bold small text-white text-truncate" style="max-width: 250px;">${title}</div>
                                <small class="text-white-50" style="font-size: 0.7rem;">${year} • ${type}</small>
                            </div>
                            <span class="btn btn-purple btn-sm rounded-pill px-2 py-0 fw-bold" style="font-size: 0.72rem;">
                                <i class="fa-solid fa-plus me-1"></i>Ekle
                            </span>
                        </div>
                    `;
                }).join("");

                sharedSearchResults.classList.remove("d-none");
            } catch (err) {
                console.warn("Ortak liste arama hatası:", err);
            }
        }, 350);
    });

    // Dışarı tıklanınca arama sonuçlarını kapat
    document.addEventListener("click", (e) => {
        if (!sharedSearchInput.contains(e.target) && !sharedSearchResults.contains(e.target)) {
            sharedSearchResults.classList.add("d-none");
        }
    });
}

// Arama Sonucundan Filme Tıklanınca Ortak Listeye Ekleme
window.addMovieToSharedList = async function (tmdbItem) {
    if (!activeSharedListData || !activeSharedListId) return;

    const toWatch = activeSharedListData.toWatch || [];
    const watched = activeSharedListData.watched || [];

    // Zaten listede var mı kontrolü
    const existsInToWatch = toWatch.some(m => String(m.id) === String(tmdbItem.id));
    const existsInWatched = watched.some(m => String(m.id) === String(tmdbItem.id));

    if (existsInToWatch || existsInWatched) {
        showToast("Bu film zaten ortak listenizde bulunuyor! 🍿", "warning");
        sharedSearchResults.classList.add("d-none");
        sharedSearchInput.value = "";
        return;
    }

    const myDoc = await db.collection("users").doc(currentUser.uid).get();
    const myName = (myDoc.exists ? myDoc.data().username : null) || "Sen";

    const movieObj = {
        id: tmdbItem.id,
        title: tmdbItem.title || tmdbItem.name || "Film",
        poster_path: tmdbItem.poster_path || "",
        release_date: tmdbItem.release_date || tmdbItem.first_air_date || "",
        vote_average: tmdbItem.vote_average || 0,
        addedByUid: currentUser.uid,
        addedByName: myName,
        ratings: {},
        reviews: {},
        favorites: []
    };

    try {
        toWatch.unshift(movieObj);
        activeSharedListData.toWatch = toWatch;

        await db.collection("sharedLists").doc(activeSharedListId).update({
            toWatch: toWatch,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Arama kutusunu temizle ve kapat
        sharedSearchResults.classList.add("d-none");
        sharedSearchInput.value = "";

        activeSharedTab = "toWatch";
        renderSharedListUI();
        loadSharedLists();
        showToast(`"${movieObj.title}" ortak listenize eklendi! ✨`, "success");
    } catch (err) {
        showToast("Eklenirken hata oluştu: " + err.message, "error");
    }
};

// "Birlikte İzledik" Butonuna Basılınca
window.markSharedMovieWatched = async function (movieId) {
    if (!activeSharedListData || !activeSharedListId) return;

    const toWatch = activeSharedListData.toWatch || [];
    const watched = activeSharedListData.watched || [];

    const movieIndex = toWatch.findIndex(m => String(m.id) === String(movieId));
    if (movieIndex === -1) return;

    const [movedMovie] = toWatch.splice(movieIndex, 1);
    if (!movedMovie.ratings) movedMovie.ratings = {};
    if (!movedMovie.reviews) movedMovie.reviews = {};
    if (!movedMovie.favorites) movedMovie.favorites = [];

    watched.unshift(movedMovie);

    activeSharedListData.toWatch = toWatch;
    activeSharedListData.watched = watched;

    try {
        await db.collection("sharedLists").doc(activeSharedListId).update({
            toWatch: toWatch,
            watched: watched,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        renderSharedListUI();
        loadSharedLists();
        showToast(`Tebrikler! "${movedMovie.title}" birlikte izlenenlere taşındı! 🎬`, "success");
    } catch (err) {
        showToast("Güncellenirken hata oluştu: " + err.message, "error");
    }
};

// Ortak Listeden Film Kaldırma
window.removeSharedMovie = async function (movieId, listType) {
    if (!activeSharedListData || !activeSharedListId) return;

    try {
        if (listType === "toWatch") {
            activeSharedListData.toWatch = (activeSharedListData.toWatch || []).filter(m => String(m.id) !== String(movieId));
            await db.collection("sharedLists").doc(activeSharedListId).update({
                toWatch: activeSharedListData.toWatch
            });
        } else {
            activeSharedListData.watched = (activeSharedListData.watched || []).filter(m => String(m.id) !== String(movieId));
            await db.collection("sharedLists").doc(activeSharedListId).update({
                watched: activeSharedListData.watched
            });
        }

        renderSharedListUI();
        loadSharedLists();
        showToast("Film ortak listeden kaldırıldı.", "info");
    } catch (err) {
        showToast("Silinirken hata oluştu: " + err.message, "error");
    }
};

// Ortak Film İçin Puanlama & Yorum Modalı Açma
window.openSharedReviewModal = function (movieId) {
    if (!activeSharedListData) return;

    activeSharedReviewMovieId = movieId;
    const watchedList = activeSharedListData.watched || [];
    const movie = watchedList.find(m => String(m.id) === String(movieId));
    if (!movie) return;

    currentSharedSelectedRating = movie.ratings?.[currentUser.uid] || 0;
    currentSharedIsFavorite = movie.favorites?.includes(currentUser.uid) || false;

    document.getElementById("sharedReviewMovieTitle").innerText = movie.title || "Film";
    document.getElementById("sharedReviewMovieYear").innerText = (movie.release_date || "").split("-")[0] || "";
    document.getElementById("sharedMovieReviewComment").value = movie.reviews?.[currentUser.uid] || "";

    renderSharedRatingButtons();
    updateSharedFavoriteBtnUI();

    new bootstrap.Modal(document.getElementById("sharedMovieReviewModal")).show();
};

// Ortak Puan Butonlarını Çiz
function renderSharedRatingButtons() {
    const container = document.getElementById("sharedRatingButtonsContainer");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        const isSelected = (currentSharedSelectedRating === i);
        btn.className = `btn btn-sm ${isSelected ? 'btn-purple text-white shadow' : 'btn-dark border-secondary text-white-50'} rounded-circle fw-bold`;
        btn.style.width = "34px";
        btn.style.height = "34px";
        btn.style.padding = "0";
        btn.style.fontSize = "0.8rem";
        btn.innerText = i;
        btn.onclick = () => {
            currentSharedSelectedRating = i;
            renderSharedRatingButtons();
        };
        container.appendChild(btn);
    }
}

// Ortak Favori Butonu UI Güncelleme
function updateSharedFavoriteBtnUI() {
    const btn = document.getElementById("sharedReviewFavoriteBtn");
    const icon = document.getElementById("sharedReviewFavoriteIcon");
    const text = document.getElementById("sharedReviewFavoriteText");
    if (!btn || !icon || !text) return;

    if (currentSharedIsFavorite) {
        btn.className = "btn btn-danger btn-sm rounded-pill px-3 fw-bold";
        icon.className = "fa-solid fa-heart me-1";
        text.innerText = "Favorilerimde ❤️";
    } else {
        btn.className = "btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold";
        icon.className = "fa-regular fa-heart me-1";
        text.innerText = "Favorilere Ekle";
    }
}

document.getElementById("sharedReviewFavoriteBtn")?.addEventListener("click", () => {
    currentSharedIsFavorite = !currentSharedIsFavorite;
    updateSharedFavoriteBtnUI();
});

// Ortak Değerlendirmeyi Kaydet
document.getElementById("saveSharedReviewBtn")?.addEventListener("click", async () => {
    if (!activeSharedListData || !activeSharedListId || !activeSharedReviewMovieId || !currentUser) return;

    const watchedList = activeSharedListData.watched || [];
    const movie = watchedList.find(m => String(m.id) === String(activeSharedReviewMovieId));
    if (!movie) return;

    const comment = document.getElementById("sharedMovieReviewComment").value.trim();

    if (!movie.ratings) movie.ratings = {};
    if (!movie.reviews) movie.reviews = {};
    if (!movie.favorites) movie.favorites = [];

    // Puanı güncelle
    if (currentSharedSelectedRating > 0) {
        movie.ratings[currentUser.uid] = currentSharedSelectedRating;
    }

    // Yorumu güncelle
    if (comment) {
        movie.reviews[currentUser.uid] = comment;
    }

    // Favoriyi güncelle
    if (currentSharedIsFavorite) {
        if (!movie.favorites.includes(currentUser.uid)) {
            movie.favorites.push(currentUser.uid);
        }
    } else {
        movie.favorites = movie.favorites.filter(uid => uid !== currentUser.uid);
    }

    try {
        await db.collection("sharedLists").doc(activeSharedListId).update({
            watched: watchedList,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        bootstrap.Modal.getInstance(document.getElementById("sharedMovieReviewModal"))?.hide();
        renderSharedListUI();
        showToast("Ortak değerlendirmeniz kaydedildi! ⭐", "success");
    } catch (err) {
        showToast("Kaydedilirken hata oluştu: " + err.message, "error");
    }
});


// ==================================================================
// EVRENSEL ONAY MODALI YARDIMCI FONKSİYONU
// ==================================================================
// Kullanım: showConfirmModal({ title, message, btnText, btnClass, icon, onConfirm })
function showConfirmModal({ title, message, btnText = "Evet, Devam Et", btnClass = "btn-danger", icon = "fa-triangle-exclamation text-warning", onConfirm }) {
    document.getElementById("confirmActionTitle").innerText = title;
    document.getElementById("confirmActionMessage").innerText = message;
    document.getElementById("confirmActionIcon").innerHTML = `<i class="fa-solid ${icon}" style="font-size: 2.5rem;"></i>`;

    const yesBtn = document.getElementById("confirmActionYesBtn");
    yesBtn.className = `btn ${btnClass} rounded-pill flex-fill py-2 fw-bold`;
    yesBtn.innerHTML = `<i class="fa-solid fa-check me-1"></i>${btnText}`;

    // Önceki event listener'ı temizle (çakışma olmasın)
    const newBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newBtn, yesBtn);

    const modal = new bootstrap.Modal(document.getElementById("confirmActionModal"));

    newBtn.addEventListener("click", () => {
        modal.hide();
        onConfirm();
    });

    modal.show();
    // Modal kapandığında artık kalan perdeleri temizle (donma sorununu engeller)
    document.getElementById("confirmActionModal").addEventListener("hidden.bs.modal", () => {
        document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    }, { once: true }); // { once: true } = Her açılışta sadece bir kere çalış
}

// ==================================================================
// HESABI SİL BUTONU
// ==================================================================
document.getElementById("deleteAccountBtn")?.addEventListener("click", () => {
    showConfirmModal({
        title: "Hesabı Kalıcı Olarak Sil",
        message: "Tüm profil bilgileriniz, kaydettiğiniz ve izlediğiniz filmler, ortak listeleriniz geri alınamaz şekilde silinecektir. Bu işlem geri alınamaz!",
        btnText: "Hesabı Sil",
        btnClass: "btn-danger",
        icon: "fa-trash text-danger",
        onConfirm: async () => {
            if (!currentUser) return;
            try {
                await db.collection("users").doc(currentUser.uid).delete();
                await currentUser.delete();
                showToast("Hesabınız silindi. Görüşmek üzere! 👋", "success");
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                if (err.code === "auth/requires-recent-login") {
                    showToast("Hesabı silmek için çıkış yapıp tekrar giriş yapmanız gerekiyor.", "error");
                } else {
                    showToast("Hata: " + err.message, "error");
                }
            }
        }
    });
});