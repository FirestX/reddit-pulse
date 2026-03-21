// Interfaccia che definisce la struttura rigida di una notizia
// Serve per garantire che ogni articolo abbia tutti i campi necessari (TypeScript)
interface Notizia {
  id: number;
  titolo: string;
  categoria: string;
  immagine: string;
  autore: string;
  tempo: string;
  testo: string;
}

// Database simulato (Mock DB) contenente tutti gli articoli disponibili
const notizieDb: Notizia[] = [
  {
    id: 1,
    titolo: "L'Intelligenza Artificiale nel 2025: Come cambierà il nostro modo di lavorare",
    categoria: "Tecnologia",
    immagine: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
    autore: "Marco Rossi",
    tempo: "5 min",
    testo: "<p style='margin-bottom: 24px;'>L'intelligenza artificiale non è più solo una promessa del futuro... Le aziende stanno integrando l'IA per automatizzare le email e scrivere codice.</p><p>Prepararsi oggi significa assicurarsi un vantaggio competitivo domani.</p>"
  },
  {
    id: 2,
    titolo: "Nuovi processori quantistici: La fine dei computer tradizionali?",
    categoria: "Hardware",
    immagine: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
    autore: "Laura Bianchi",
    tempo: "8 min",
    testo: "<p style='margin-bottom: 24px;'>I laboratori di tutto il mondo stanno facendo passi da gigante nell'informatica quantistica. Un processore quantistico non usa i bit tradizionali (0 e 1), ma i qubit.</p><p>Questo permetterà di risolvere in pochi secondi calcoli che richiederebbero millenni ai supercomputer attuali.</p>"
  },
  {
    id: 3,
    titolo: "Il design minimalista nelle interfacce di domani",
    categoria: "Design",
    immagine: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    autore: "Giulia Neri",
    tempo: "4 min",
    testo: "<p style='margin-bottom: 24px;'>Meno è meglio. Il sovraccarico di informazioni ha spinto i designer a creare interfacce sempre più pulite e invisibili.</p><p>L'obiettivo del 2025 è far sparire la tecnologia, lasciando all'utente solo il contenuto puro.</p>"
  },
  {
    id: 4,
    titolo: "Missione Marte: Trovate tracce di acqua liquida",
    categoria: "Spazio",
    immagine: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
    autore: "Luca Verdi",
    tempo: "10 min",
    testo: "<p style='margin-bottom: 24px;'>I nuovi rover inviati sul pianeta rosso hanno analizzato il sottosuolo rivelando qualcosa di incredibile. L'acqua non è solo ghiacciata ai poli, ma potrebbe esistere in forma liquida sotto la superficie.</p>"
  },
  {
    id: 5,
    titolo: "Cybersecurity: I nuovi rischi del Web 3.0",
    categoria: "Sicurezza",
    immagine: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
    autore: "Elena Conti",
    tempo: "6 min",
    testo: "<p style='margin-bottom: 24px;'>Con l'evoluzione di internet, cambiano anche gli hacker. Il Web 3.0 decentralizzato porta nuovi vantaggi ma espone gli utenti a truffe molto più sofisticate.</p><p>La sicurezza dei portafogli digitali è ora la priorità numero uno.</p>"
  },
  {
    id: 6,
    titolo: "Bitcoin supera un nuovo record storico",
    categoria: "Crypto",
    immagine: "https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=1200&auto=format&fit=crop",
    autore: "Andrea Romano",
    tempo: "3 min",
    testo: "<p style='margin-bottom: 24px;'>I mercati finanziari sono in subbuglio dopo l'ultima impennata delle criptovalute. Gli investitori istituzionali stanno spostando capitali enormi verso asset digitali.</p>"
  }
];

// Funzione per recuperare gli ID degli articoli salvati dal LocalStorage
function getSalvati(): number[] {
  const salvatiStr = localStorage.getItem('salvati_ids');
  return salvatiStr ? JSON.parse(salvatiStr) : [];
}

// Funzione per aggiungere o rimuovere un articolo dai salvati
function toggleSalvataggio(id: number) {
  let salvati = getSalvati();
  if (salvati.includes(id)) {
    // Se è già salvato, lo rimuoviamo
    salvati = salvati.filter(savedId => savedId !== id);
  } else {
    // Altrimenti lo aggiungiamo
    salvati.push(id);
  }
  // Aggiorniamo la memoria del browser
  localStorage.setItem('salvati_ids', JSON.stringify(salvati));
}

// ==========================================
// LOGICA PER LA HOMEPAGE (index.html)
// ==========================================
const grigliaHome = document.getElementById('griglia-notizie');
if (grigliaHome) {
  // Generazione dinamica delle card per ogni articolo nel database
  notizieDb.forEach(notizia => {
    grigliaHome.innerHTML += `
      <a href="articolo.html?id=${notizia.id}" class="card" style="border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; text-decoration: none; color: white; background-color: #22101e; display: block; transition: transform 0.2s;">
        <img src="${notizia.immagine}" style="width: 100%; height: 180px; object-fit: cover;">
        <div style="padding: 16px;">
          <span style="color: #f425c0; font-size: 12px; font-weight: bold; text-transform: uppercase;">${notizia.categoria}</span>
          <h3 style="font-size: 18px; margin: 8px 0; line-height: 1.4;">${notizia.titolo}</h3>
          <div style="color: #a1a1aa; font-size: 12px; margin-top: 10px;">Di ${notizia.autore} • ${notizia.tempo}</div>
        </div>
      </a>
    `;
  });
}

// ==========================================
// LOGICA PER LA PAGINA ARTICOLO (articolo.html)
// ==========================================
const containerArticolo = document.getElementById('contenitore-articolo');
const btnLike = document.getElementById('like-btn');

if (containerArticolo) {
  // Estraiamo l'ID dell'articolo dall'URL (es. articolo.html?id=2)
  const params = new URLSearchParams(window.location.search);
  const currentId = Number(params.get('id'));
  
  // Cerchiamo l'articolo corrispondente nel nostro database
  const article = notizieDb.find(n => n.id === currentId);

  if (article) {
    // Popoliamo l'HTML con i dati dell'articolo trovato
    document.getElementById('art-img')!.setAttribute('src', article.immagine);
    document.getElementById('art-cat')!.innerText = article.categoria;
    document.getElementById('art-title')!.innerText = article.titolo;
    document.getElementById('art-meta')!.innerHTML = `Di <strong>${article.autore}</strong> • ${article.tempo} di lettura`;
    document.getElementById('art-text')!.innerHTML = article.testo;

    // Gestione del pulsante "Salva articolo"
    if (btnLike) {
      // Coloriamo il bottone se l'articolo è già nei preferiti
      if (getSalvati().includes(article.id)) {
        btnLike.style.color = '#f425c0';
      }
      // Aggiungiamo l'evento click
      btnLike.addEventListener('click', function() {
        toggleSalvataggio(article.id);
        if (getSalvati().includes(article.id)) {
          btnLike.style.color = '#f425c0'; // Rosa se salvato
        } else {
          btnLike.style.color = '#a1a1aa'; // Grigio se rimosso
        }
      });
    }
  } else {
    // Fallback se l'ID non esiste
    containerArticolo.innerHTML = "<h1 style='color: white;'>Articolo non trovato</h1>";
  }
}

// ==========================================
// LOGICA PER IL PROFILO (profilo.html)
// ==========================================
const grigliaSalvati = document.getElementById('griglia-salvati');
const bloccoNote = document.getElementById('blocco-note');
const textAreaNota = document.getElementById('nota-testo') as HTMLTextAreaElement | null;
const btnSalvaNota = document.getElementById('salva-nota');
const notaConferma = document.getElementById('nota-conferma');

if (grigliaSalvati && bloccoNote) {
  // Recuperiamo gli ID salvati e filtriamo il database
  const salvatiIds = getSalvati();
  const savedArticles = notizieDb.filter(n => salvatiIds.includes(n.id));

  if (savedArticles.length > 0) {
    // Mostriamo gli articoli preferiti
    savedArticles.forEach(notizia => {
      grigliaSalvati.innerHTML += `
        <a href="articolo.html?id=${notizia.id}" class="card" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; display: block; overflow: hidden; text-decoration: none; color: white; background-color: #22101e; margin-bottom: 20px;">
          <img src="${notizia.immagine}" style="width: 100%; height: 180px; object-fit: cover;">
          <div style="padding: 16px;">
              <span style="color: #f425c0; font-size: 12px; font-weight: bold; text-transform: uppercase;">${notizia.categoria}</span>
              <h3 style="font-size: 18px; margin-top: 8px;">${notizia.titolo}</h3>
          </div>
        </a>
      `;
    });

    // Mostriamo la sezione delle note personali
    bloccoNote.style.display = 'block';

    // Carichiamo le note precedenti se esistono
    if (textAreaNota) {
      const notaSalvata = localStorage.getItem('nota_personale');
      if (notaSalvata) {
        textAreaNota.value = notaSalvata;
      }
    }

    // Gestione salvataggio note
    if (btnSalvaNota && textAreaNota && notaConferma) {
      btnSalvaNota.addEventListener('click', function() {
        localStorage.setItem('nota_personale', textAreaNota.value);
        notaConferma.style.display = 'inline';
        setTimeout(() => {
          notaConferma.style.display = 'none';
        }, 2000);
      });
    }
  } else {
    // Messaggio se non ci sono articoli salvati
    grigliaSalvati.innerHTML = "<p style='color: #a1a1aa;'>Nessun articolo salvato.</p>";
  }
}