/**
 * VELEA assistant: understands a visitor's message and writes the answer.
 *
 * The chat panel (velea-assistant in theme.js) loads this file the first time
 * it opens and asks it for each answer. It reads everyday French: typos, SMS
 * spellings ("slt", "cmb", "pk"), missing accents, several questions in one
 * message. About 70 subjects are known, from small talk ("ça va ?") to the
 * belt's battery, the size guide, a parcel that is late or a refund.
 *
 * Every fact comes from the shop: the products of the chosen collection (price,
 * options, stock, and the details shown on their pages), the theme's shipping,
 * returns and warranty settings, the assistant's own answers set in the theme
 * editor, and the payment methods Shopify reports. The conversation is
 * remembered (the product being discussed, a question just asked) so "et en
 * blanc ?" or "oui" make sense. When the shop's data does not hold the answer,
 * the assistant says what it does know and offers the team, the question
 * already written: it never makes a fact up. Nothing leaves the browser.
 */
(() => {
  /* ------------------------------------------------------------------ */
  /* Reading French                                                      */
  /* ------------------------------------------------------------------ */

  /** Shortcuts and frequent spellings, rewritten before reading. */
  const SPELLINGS = {
    slt: 'salut', bjr: 'bonjour', bjour: 'bonjour', bonjoure: 'bonjour', bsr: 'bonsoir', cc: 'coucou', wsh: 'wesh',
    hi: 'hello', hey: 'hello', helo: 'hello', rebonjour: 're bonjour', cv: 'ca va', cva: 'ca va', sava: 'ca va', sa: 'ca',
    stp: 's il te plait', svp: 's il vous plait', plait: 'plait',
    mrc: 'merci', mci: 'merci', mercii: 'merci', merciii: 'merci', thx: 'merci', thanks: 'merci', cimer: 'merci',
    pk: 'pourquoi', pq: 'pourquoi', pkoi: 'pourquoi', pcq: 'parce que', psk: 'parce que', paske: 'parce que',
    dac: 'd accord', dacc: 'd accord', dak: 'd accord', daccord: 'd accord', oki: 'ok', okay: 'ok', okk: 'ok', okey: 'ok',
    ouais: 'oui', ouai: 'oui', ouii: 'oui', ouiii: 'oui', oe: 'oui', wi: 'oui', yes: 'oui', yep: 'oui', nan: 'non', nope: 'non', non: 'non',
    jsp: 'je ne sais pas', jss: 'je suis', chui: 'je suis', chuis: 'je suis', jsuis: 'je suis', jai: 'j ai',
    jveux: 'je veux', jvoudrais: 'je voudrais', jvoudrai: 'je voudrais', voudrai: 'voudrais', jpeux: 'je peux', jpense: 'je pense',
    qd: 'quand', kan: 'quand', cmb: 'combien', cbm: 'combien', cmt: 'comment', cmnt: 'comment', koi: 'quoi', kwa: 'quoi',
    kel: 'quel', kelle: 'quelle', ke: 'que', ki: 'qui', bcp: 'beaucoup', tjrs: 'toujours', tjr: 'toujours', mtn: 'maintenant',
    pr: 'pour', ds: 'dans', vs: 'vous', ns: 'nous', tt: 'tout', tte: 'toute', mm: 'meme', pb: 'probleme', pbm: 'probleme', prob: 'probleme',
    ya: 'il y a', yatil: 'y a t il', dispo: 'disponible', dispos: 'disponible', cmd: 'commande', cde: 'commande',
    comande: 'commande', commade: 'commande', commende: 'commande', comender: 'commander', info: 'information', infos: 'information',
    tel: 'telephone', mail: 'email', mails: 'email', mel: 'email', courriel: 'email', insta: 'instagram', fb: 'facebook',
    ptdr: 'mdr', lol: 'mdr', xd: 'mdr', haha: 'mdr', hahaha: 'mdr', ahah: 'mdr', ahahah: 'mdr', hihi: 'mdr', hehe: 'mdr',
    blanche: 'blanc', blanches: 'blanc', noire: 'noir', noires: 'noir', grise: 'gris', roses: 'rose', rouges: 'rouge',
    deux: '2', trois: '3', quatre: '4', cinq: '5', tkt: 'ne t inquiete pas', auj: 'aujourd hui', ajd: 'aujourd hui',
    qqch: 'quelque chose', qqc: 'quelque chose', tg: 'ta gueule', ntm: 'insulte', fdp: 'insulte', eur: 'euro', euros: 'euro',
    regle: 'regle', rgl: 'regle', vetements: 'vetement', bjrs: 'bonjour', biz: 'bisou', bisous: 'bisou', merkii: 'merci',
  };

  /** Words whose final "s" or "x" is not a plural. */
  const INVARIABLE = new Set([
    'mois', 'fois', 'temps', 'prix', 'plus', 'moins', 'tres', 'apres', 'pres', 'dos', 'pays', 'avis', 'colis', 'frais', 'jamais',
    'depuis', 'mais', 'sans', 'dans', 'sous', 'vous', 'nous', 'tous', 'alors', 'paris', 'gros', 'bras', 'repas', 'cours', 'jus',
    'gaz', 'ailleurs', 'parfois', 'toujours', 'puis', 'souris', 'corps', 'velours', 'remboursement', 'bas', 'pas', 'fils',
  ]);

  /** @param {unknown} text */
  function fold(text) {
    return String(text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/œ/g, 'oe')
      .replace(/€/g, ' euro ')
      .replace(/%/g, ' pourcent ')
      .replace(/[^a-z0-9+]+/g, ' ')
      .trim();
  }

  /** @param {string} word */
  function singular(word) {
    if (word.length <= 3 || INVARIABLE.has(word) || /\d/.test(word)) return word;
    if (/(au|eu)x$/.test(word)) return word.slice(0, -1);
    if (/[^s]s$/.test(word)) return word.slice(0, -1);
    return word;
  }

  /**
   * "Délais de livraisons ?" → ["delai", "de", "livraison"]
   * @param {unknown} text
   */
  function words(text) {
    const out = [];
    for (const raw of fold(text).split(' ')) {
      if (!raw) continue;
      const spelled = SPELLINGS[raw] ?? raw;
      for (const word of spelled.split(' ')) if (word) out.push(singular(word));
    }
    return out;
  }

  /**
   * Edit distance with swapped letters counting as one, stopping early past max.
   * @param {string} a
   * @param {string} b
   * @param {number} max
   */
  function distance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let previous2 = [];
    let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i += 1) {
      const row = [i];
      let best = i;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let value = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, previous2[j - 2] + 1);
        row.push(value);
        best = Math.min(best, value);
      }
      if (best > max) return max + 1;
      previous2 = previous;
      previous = row;
    }
    return previous[b.length];
  }

  /**
   * One word of a term: exact, or a prefix ("rembours*"), with room for a typo
   * in longer words ("livraisom", "remborsement").
   * @param {string} token
   * @param {{ text: string, prefix: boolean }} part
   */
  function same(token, part) {
    const { text } = part;
    if (token === text) return true;
    if (/\d/.test(token) || /\d/.test(text)) return false;
    if (part.prefix && token.startsWith(text)) return true;
    // A word the assistant knows is never read as a typo of another one ("delai" is not "relai").
    if (KNOWN.has(token)) return false;
    if (part.prefix) {
      if (text.length < 6 || token.length < text.length - 1) return false;
      for (const size of [text.length - 1, text.length, text.length + 1]) {
        if (distance(token.slice(0, size), text, 1) <= 1) return true;
      }
      return false;
    }
    if (text.length < 5 || token.length < 4) return false;
    const max = text.length >= 9 ? 2 : 1;
    return distance(token, text, max) <= max;
  }

  /** Every exact word of the subjects below, filled once they are compiled. */
  const KNOWN = new Set();

  /** @param {string} term "frais de port", "rembours*" */
  function compile(term) {
    const parts = [];
    for (const piece of term.split(' ')) {
      if (!piece) continue;
      if (piece.endsWith('*')) parts.push({ text: fold(piece.slice(0, -1)), prefix: true });
      else for (const word of words(piece)) parts.push({ text: word, prefix: false });
    }
    return parts;
  }

  /**
   * Where a term starts in the message (several places possible).
   * @param {string[]} tokens
   * @param {{ text: string, prefix: boolean }[]} parts
   */
  function find(tokens, parts) {
    const starts = [];
    if (!parts.length) return starts;
    outer: for (let start = 0; start + parts.length <= tokens.length; start += 1) {
      for (let k = 0; k < parts.length; k += 1) if (!same(tokens[start + k], parts[k])) continue outer;
      starts.push(start);
    }
    return starts;
  }

  const STOP = new Set(words(
    'le la les l un une des de du d a au aux et ou en pour par sur sous avec sans dans ce cet cette ces c mon ma mes ton ta tes ' +
      'son sa ses notre nos votre vos leur leurs je j tu il elle on nous vous ils elles me m te t se s y ne n pas plus est sont ' +
      'etre ai as a avez avoir fait faire qu que qui quoi quel quelle quels quelles comment combien pourquoi quand ou si oui non ' +
      'bien tres trop peu ca cela ceci ici la voila bonjour merci svp stp il plait madame monsieur alors donc mais car est-ce ' +
      'puis peut peux pouvez veux voudrais aimerais savoir dire question besoin moi toi vous aussi encore deja tout toute tous',
  ));

  /* ------------------------------------------------------------------ */
  /* What visitors ask                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Each subject lists the words and phrases that point to it, with a weight:
   * 3 = says it alone ("livraison"), 2 = strong hint, 1 = only with others.
   * A longer phrase wins over the words it contains: "combien de temps" is
   * not a price question, "ne chauffe pas" is not a question about heat.
   */
  const SUBJECTS = {
    greet: { family: 'social', terms: { bonjour: 3, bonsoir: 3, salut: 3, coucou: 3, hello: 3, yo: 2, wesh: 3, hola: 3, salam: 3, re: 1 } },
    howareyou: {
      family: 'social',
      terms: {
        'ca va': 3, 'comment allez vous': 4, 'comment vas tu': 4, 'comment tu vas': 4, 'comment tu va': 4, 'comment ca va': 4, 'tu vas bien': 4, 'tu va bien': 4,
        'vous allez bien': 4, 'la forme': 2, 'quoi de neuf': 3, 'bien ou quoi': 4, 'ca roule': 2, 'et toi': 1, 'et vous': 1,
      },
    },
    thanks: { family: 'social', terms: { merci: 3, 'je vous remercie': 3, remercie: 3, 'c est gentil': 2, 'trop gentil': 2, 'merci beaucoup': 4, 'top merci': 3 } },
    bye: {
      family: 'social',
      terms: {
        'au revoir': 4, aurevoir: 4, bye: 3, 'bye bye': 4, 'a bientot': 4, 'a plus': 3, 'a +': 3, ciao: 3, tchao: 3, 'bonne journee': 3,
        'bonne soiree': 3, 'bonne nuit': 3, 'a la prochaine': 4, adieu: 3, 'bonne fin de journee': 4, 'a tout a l heure': 3,
      },
    },
    bot: {
      family: 'social',
      terms: {
        robot: 3, bot: 3, chatbot: 3, ia: 3, 'intelligence artificielle': 4, 'vraie personne': 3, 'une vraie': 1, chatgpt: 3, machine: 2,
        'qui es tu': 4, 'tu es qui': 4, 't es qui': 4, 'qui etes vous': 3, 'vous etes qui': 3, 'ton nom': 3, 'votre nom': 2,
        'tu t appelle': 4, 'comment tu t appelle': 4, 'vous vous appelez': 4, 'es tu humaine': 4, 'tu es humaine': 4, 'vrais gens': 4, 'de vraies personnes': 4, 'des humains': 4, 'etes vous humain': 4, 'tu es une humaine': 4,
        'etes vous humaine': 4, 'tu es reelle': 4, 'tu es un robot': 4, 'programme': 1, automatique: 1,
      },
    },
    help: {
      family: 'social',
      terms: {
        aide: 2, aider: 2, 'besoin d aide': 3, 'tu peux faire quoi': 4, 'que sais tu faire': 4, 'tu sers a quoi': 4, 'a quoi tu sers': 4,
        'que peux tu': 3, 'qu est ce que tu sais': 3, 'tu sais faire quoi': 4, help: 3, 'j ai une question': 2, 'une question': 1, 'je cherche': 1,
      },
    },
    compliment: {
      family: 'social',
      terms: {
        'tu es gentille': 4, 'vous etes gentille': 4, 'tu es top': 4, 'tu es super': 4, 'trop bien': 2, 'j adore': 3, magnifique: 2,
        'beau site': 4, 'joli site': 4, 'site magnifique': 4, 'tres beau': 2, 'trop beau': 2, bravo: 3, 'tu es parfaite': 4, adorable: 2, 'super site': 4,
        'trop mignon': 2, 'c est beau': 2, 'j aime bien': 2, 'je kiffe': 3, sublime: 2,
      },
    },
    insult: {
      family: 'social',
      terms: {
        nul: 2, nulle: 2, 'sert a rien': 4, 'sers a rien': 4, 'tu sers a rien': 5, 'ne sers a rien': 5, 'servez a rien': 4, inutile: 3, idiot: 3, idiote: 3, debile: 3, con: 3, conne: 3, stupide: 3,
        bete: 2, merde: 3, putain: 3, chiant: 3, 'j en ai marre': 3, 'n importe quoi': 3, 'tu comprend rien': 4, 'comprend rien': 3,
        'ta gueule': 4, insulte: 4, 'pas compri': 2, 'c est nul': 4, bouffon: 3, 'tu es nulle': 4,
      },
    },
    laugh: { family: 'social', terms: { mdr: 3, 'trop drole': 3, marrant: 2, rigolo: 2 } },
    joke: { family: 'social', terms: { blague: 3, 'raconte moi': 2, 'fais moi rire': 4, 'une histoire drole': 4 } },
    personal: {
      family: 'social',
      terms: {
        'je t aime': 4, 'tu es mariee': 4, 'quel age': 3, 'ton age': 4, 'tu habite ou': 4, 'tu as quel age': 4, 'tu manges': 3, 'tu dors': 3,
        'tu es celibataire': 4, 'tu as un copain': 4, 'tu fais quoi': 2,
      },
    },
    weather: { family: 'social', terms: { meteo: 3, 'il fait beau': 4, 'il pleut': 4, 'quel temps': 3, 'il fait froid': 4, 'il fait chaud': 4 } },
    yes: {
      family: 'answer',
      terms: {
        oui: 3, ok: 3, 'd accord': 3, carrement: 3, 'bien sur': 3, volontiers: 3, exactement: 3, absolument: 3, 'je veux bien': 3,
        'avec plaisir': 2, 'vas y': 3, 'allez y': 3, go: 2, parfait: 2, 'pourquoi pas': 3, 'c est parti': 3, yes: 3, 'ca marche': 2, 'oui merci': 3,
      },
    },
    no: {
      family: 'answer',
      terms: { non: 3, 'pas vraiment': 3, 'pas du tout': 3, 'non merci': 4, 'ca ira': 3, 'c est bon': 2, 'pas besoin': 3, 'pas pour l instant': 3, 'plus tard': 2, rien: 2 },
    },
    moodGood: {
      family: 'answer',
      terms: {
        bien: 2, 'tres bien': 3, 'ca va bien': 3, 'je vais bien': 4, nickel: 3, impeccable: 3, impec: 3, tranquille: 2, 'en forme': 3, 'pas mal': 2,
        'super bien': 3, 'ca va et toi': 4, 'ca va et vous': 4, 'bien et toi': 4, 'bien et vous': 4, top: 2, cool: 2, genial: 2, super: 2, 'trop bien': 2,
      },
    },
    moodBad: {
      family: 'answer',
      terms: {
        'pas bien': 4, 'pas top': 3, 'pas terrible': 3, bof: 3, 'ca va pas': 4, fatiguee: 3, fatigue: 2, epuisee: 3, crevee: 3, triste: 3, deprime: 3,
        stresse: 2, 'pas fort': 3, 'bof bof': 4, galere: 2, 'moyen': 2, 'mouai': 2,
      },
    },
    name: { family: 'social', terms: { 'je m appelle': 4, 'moi c est': 3, 'mon prenom est': 4, 'mon prenom c est': 4, 'mon nom est': 4 } },

    catalogue: {
      family: 'product',
      terms: {
        produit: 2, 'vos produits': 3, 'quels produits': 4, 'quel produit': 2, catalogue: 3, article: 2, 'vos articles': 3, gamme: 3, collection: 2,
        'vous vendez quoi': 4, 'que vendez vous': 4, 'vous vendez': 2, 'qu est ce que vous vendez': 4, 'vous avez quoi': 4, 'vous proposez': 3,
        'qu avez vous': 3, 'tout voir': 3, essentiel: 2, 'voir les produits': 4, 'nos produits': 3, 'la boutique': 1, 'quels articles': 4,
      },
    },
    recommend: {
      family: 'product',
      terms: {
        conseil: 3, 'conseill*': 3, conseiller: 2, 'me conseiller': 4, 'vous me conseillez': 4, 'tu me conseille': 4, recommand: 2, 'recommand*': 3, lequel: 3, laquelle: 3,
        choisir: 2, hesite: 3, 'j hesite': 4, difference: 3, comparer: 3, compar: 2, 'le mieux': 2, 'la mieux': 2, meilleur: 2, meilleure: 2,
        'quoi prendre': 4, 'que prendre': 4, 'pour moi': 1, adapte: 2, convient: 2, 'ideal': 1, 'quel est le mieux': 4, 'm aider a choisir': 4,
        'aide moi a choisir': 4, 'je sais pas quoi prendre': 4, 'je ne sais pas quoi prendre': 4,
      },
    },
    buy: {
      family: 'shop',
      terms: {
        acheter: 3, achat: 2, 'je prend': 1, 'je la prend': 4, 'je le prend': 4, 'je les prend': 4, prendre: 1, 'je veux': 1, 'je voudrais': 1,
        commander: 3, 'passer commande': 4, 'comment commander': 4, 'ajouter au panier': 4, 'ajoute au panier': 4, 'l ajouter au panier': 4,
        'mettre dans mon panier': 4, 'mettre au panier': 4, 'je la veux': 4, 'je le veux': 4, 'je les veux': 4, 'je commande': 4, 'ajoute la': 3,
        'ajoute le': 3, 'ajouter la': 3, 'ajouter le': 3, ajouter: 2, ajoute: 2, 'je craque': 3, 'je me lance': 3, 'prendre la': 2, 'prendre le': 2,
      },
    },
    cart: { family: 'shop', terms: { panier: 2, 'mon panier': 3, 'voir mon panier': 4, 'voir le panier': 4, 'valider ma commande': 4, 'finaliser': 3, checkout: 3, 'valider mon panier': 4 } },
    price: {
      family: 'product',
      terms: {
        prix: 3, combien: 2, coute: 3, 'coute combien': 4, cout: 2, tarif: 3, cher: 2, chere: 2, euro: 2, budget: 2, 'a combien': 3, montant: 2,
        'quel prix': 4, 'combien ca coute': 4, 'si cher': 3, 'trop cher': 3, 'pourquoi c est cher': 4, 'c est combien': 4, 'moins cher': 2, abordable: 2, 'le duo': 1, economie: 2, 'combien pour': 3,
      },
    },
    promo: {
      family: 'shop',
      terms: {
        promo: 3, promotion: 3, 'code promo': 4, reduction: 3, reduc: 3, remise: 3, rabais: 3, solde: 3, 'bon plan': 3, discount: 3, coupon: 3,
        'code de reduction': 4, 'code reduction': 4, 'bon de reduction': 4, '10 pourcent': 3, 'offre de bienvenue': 4, 'black friday': 4,
        'premiere commande': 2, 'code': 2, 'un code': 3, 'offre du moment': 4, 'offres en cours': 4, 'ristourne': 3, 'gratuit': 1,
      },
    },
    stock: {
      family: 'product',
      terms: {
        stock: 3, 'en stock': 4, disponible: 3, disponibilite: 3, rupture: 3, epuise: 3, epuisee: 3, 'il en reste': 4, 'reste t il': 3,
        reassort: 3, restock: 3, 'de retour': 2, 'plus disponible': 4, 'encore disponible': 4, 'il y en a': 2,
      },
    },
    colors: {
      family: 'product',
      terms: {
        couleur: 3, coloris: 3, teinte: 3, 'quelle couleur': 4, 'quelles couleur': 4, 'autre couleur': 4, 'existe en': 3, 'en quelle couleur': 4,
        'en rose': 2, 'en blanc': 2, 'en noir': 2, 'en beige': 2, 'en rouge': 2, 'les couleur': 3,
      },
    },
    sizes: {
      family: 'product',
      terms: {
        taille: 3, 'guide des taille': 4, 'guide de taille': 4, 'quelle taille': 4, 'ma taille': 4, mesure: 2, mesurer: 3, 'tour de taille': 4,
        'tour de hanche': 4, hanche: 3, 'grande taille': 4, 'petite taille': 4, 'taille unique': 4, ajustable: 3, reglable: 3, sangle: 3,
        elastique: 2, 'tour de ventre': 4, ronde: 2, 'je fais du': 3, 'je fais une': 2, 'du 3xl': 3, 'du 4xl': 3, 'du xl': 3, 'du xxl': 3, taillent: 3,
        'taille grand': 4, 'taille petit': 4, 'taille bien': 3, kilo: 2, kg: 2, 'ca taille': 4,
      },
    },
    specs: {
      family: 'product',
      terms: {
        caracteristique: 3, 'fiche technique': 4, technique: 2, detail: 2, 'en detail': 3, dimension: 3, poids: 3, 'combien pese': 4, pese: 3,
        matiere: 3, composition: 3, tissu: 3, materiau: 3, 'en quoi': 2, coton: 2, viscose: 3, elasthanne: 3, velours: 3, plastique: 2,
        'fait en quoi': 4, 'fabrique en quoi': 4, 'quelle matiere': 4, 'c est quoi la matiere': 4, longueur: 3, 'combien mesure': 4,
      },
    },
    heat: {
      family: 'product',
      terms: {
        chaleur: 3, 'chauff*': 2, chaud: 2, temperature: 3, degre: 3, 'combien de degre': 4, niveau: 2, 'niveaux de chaleur': 4, tiede: 2,
        'chauffe vite': 4, 'chauffe fort': 4, 'chauffe bien': 4, '50': 1, '60': 1, 'trop chaud': 3, 'assez chaud': 3,
      },
    },
    vibration: { family: 'product', terms: { vibration: 3, vibre: 3, 'vibr*': 2, massage: 3, masse: 2, masser: 3, 'mass*': 1, 'mode de massage': 4, 'les mode': 2, 'm1': 2, 'm4': 2 } },
    battery: {
      family: 'product',
      terms: {
        batterie: 3, autonomie: 3, 'recharg*': 3, charge: 3, charger: 3, chargeur: 3, usb: 3, 'usb c': 4, 'type c': 4, cable: 2, pile: 3, voyant: 3,
        'combien de temps dure': 3, 'dure combien': 3, 'tient combien': 3, 'tient combien de temps': 4, 'dure combien de temps': 4, 'tenir combien de temps': 4, mah: 3, secteur: 2, prise: 2, brancher: 3, branche: 2, alimentation: 3,
        'sans fil': 3, fil: 2, 'temps de charge': 4, 'se recharge': 4, 'adaptateur': 3,
      },
    },
    timer: {
      family: 'product',
      terms: {
        'arret automatique': 4, 's arrete': 3, 's eteint': 3, minuteur: 3, timer: 3, '30 minute': 3, 'combien de temps l utiliser': 4,
        'combien de temps la porter': 4, 'combien de temps la garder': 4, 'duree d utilisation': 4, 'combien de fois par jour': 4, 'par jour': 2,
        'toute la journee': 3, 'en continu': 3, 'combien de temps': 1,
      },
    },
    howto: {
      family: 'product',
      terms: {
        'comment utiliser': 4, 'comment l utiliser': 4, 'comment mettre': 4, 'comment porter': 4, 'comment allumer': 4, 'comment l allumer': 4, 'comment on l utilise': 4, 'comment s en servir': 4, utilisation: 3, utiliser: 2,
        'mode d emploi': 4, notice: 3, mettre: 1, porter: 2, 'comment la porter': 4, 'comment la mettre': 4, allumer: 3, eteindre: 3,
        fonctionnement: 3, 'comment ca marche': 4, 'comment ca fonctionne': 4, 'comment elle marche': 4, 'comment elle fonctionne': 4,
        'premiere utilisation': 4, regler: 2, reglage: 3, positionner: 3, placer: 2, installer: 2, bouton: 3, 'comment on fait': 2, 'mode d utilisation': 4,
      },
    },
    care: {
      family: 'product',
      terms: {
        laver: 3, lavage: 3, entretien: 3, entretenir: 3, nettoyer: 3, nettoyage: 3, machine: 2, 'machine a laver': 4, 'en machine': 4,
        rincer: 3, secher: 3, sechage: 3, 'seche linge': 4, lessive: 3, adoucissant: 3, 'a la main': 2, savon: 2, 'comment la laver': 4, 'se lave': 4, lave: 2,
      },
    },
    box: {
      family: 'product',
      terms: {
        contenu: 3, 'dans le colis': 4, 'dans la boite': 4, 'livre avec': 4, 'livree avec': 4, fourni: 3, fournie: 3, inclu: 3, inclus: 3, comprend: 2,
        emballage: 2, packaging: 2, 'combien de serviette': 4, 'combien dans le lot': 4, 'dans le lot': 4, 'dans le pack': 4, 'combien y en a': 4, 'combien il y en a': 4, 'qu y a t il': 3, 'il y a quoi dans': 4, accessoire: 2, 'chargeur inclu': 4, 'chargeur fourni': 4, 'avec le cable': 3,
      },
    },
    safety: {
      family: 'care',
      terms: {
        dangereux: 3, danger: 3, securite: 3, 'sans danger': 4, risque: 3, precaution: 3, 'contre indication': 4, 'contre indique': 4,
        'effet secondaire': 4, bruler: 3, brulure: 3, irritation: 3, allergie: 3, 'la peau': 2, dormir: 3, nuit: 2, sommeil: 3, 'en dormant': 4,
        'toute la nuit': 4, eau: 2, douche: 3, bain: 3, mouille: 3, etanche: 3, 'risque de brulure': 4, 'peut on dormir': 4,
      },
    },
    health: {
      family: 'care',
      terms: {
        enceinte: 4, grossesse: 4, allaitement: 4, allaite: 4, endometriose: 4, sopk: 4, kyste: 4, fibrome: 4, sterilet: 4, diu: 3, pilule: 3,
        contraception: 4, maladie: 3, malade: 2, medecin: 3, gyneco: 4, gynecologue: 4, medicament: 4, traitement: 3, soigner: 3, guerir: 3,
        cardiaque: 4, coeur: 2, pacemaker: 4, stimulateur: 4, diabete: 4, epilepsie: 4, cancer: 4, tumeur: 4, operation: 3, chirurgie: 4,
        cesarienne: 4, hernie: 4, menopause: 3, hemorragie: 4, 'saigne beaucoup': 4, fievre: 4, infection: 4, 'dispositif medical': 4,
        ordonnance: 4, mutuelle: 3, secu: 3, doliprane: 4, spasfon: 4, ibuprofene: 4, antidouleur: 4, paracetamol: 4, ado: 2, adolescente: 3,
        'ma fille': 2, mineure: 3, '12 an': 3, '13 an': 3, '14 an': 3, '15 an': 3, '16 an': 3, enfant: 2, ivg: 4, 'fausse couche': 4,
      },
    },
    pain: {
      family: 'care',
      terms: {
        'mal au ventre': 4, douleur: 3, crampe: 3, 'regle douloureuse': 4, 'j ai mal': 4, 'ca fait mal': 3, 'mal au dos': 4, lombaire: 3,
        dysmenorrhee: 4, spasme: 3, 'j ai des douleurs': 4, 'je souffre': 4, souffre: 3, 'tres mal': 3, 'trop mal': 3, 'mal de ventre': 4, 'avoir mal': 3,
      },
    },
    effect: {
      family: 'product',
      terms: {
        efficace: 3, efficacite: 3, 'ca marche vraiment': 4, 'ca marche bien': 4, 'est ce que ca marche': 4, 'ca soulage': 4, soulager: 3, soulage: 3,
        'ca aide': 3, 'ca aide vraiment': 4, resultat: 2, 'vaut le coup': 4, 'ca vaut le coup': 4, 'rapport qualite prix': 4, qualite: 2, solide: 3,
        durable: 2, resistant: 3, 'bonne qualite': 4, 'elle est bien': 3, 'est elle bien': 3, 'elle vaut quoi': 4, 'ca fonctionne vraiment': 4, 'ca fonctionne bien': 4, utile: 2, 'ca change quoi': 3,
      },
    },
    reviews: {
      family: 'product',
      terms: { avis: 3, 'les avis': 4, temoignage: 3, note: 2, etoile: 3, commentaire: 3, 'retours client': 4, 'clientes satisfaite': 4, 'votre avis': 3, 'ton avis': 3, 'tu en pense quoi': 3, 'vous en pensez quoi': 3 },
    },
    discreet: {
      family: 'product',
      terms: {
        discret: 3, discrete: 3, discretion: 3, 'se voit': 3, visible: 2, 'sous les vetement': 4, 'sous un pull': 4, 'sous mes vetement': 4,
        'au travail': 3, 'au bureau': 3, 'en cours': 2, 'a l ecole': 3, dehors: 3, exterieur: 3, sortir: 2, transport: 2, voyage: 2, bouger: 2,
        marcher: 2, sport: 2, 'pendant le sport': 4, 'faire du sport': 4, 'en faisant du sport': 4, bruit: 3, bruyant: 3, silencieux: 3, 'fait du bruit': 4, 'en bougeant': 3, 'a l exterieur': 4,
      },
    },
    gift: {
      family: 'shop',
      terms: {
        cadeau: 3, offrir: 3, 'pour offrir': 4, anniversaire: 3, noel: 3, 'fete des mere': 4, 'saint valentin': 4, 'pour ma copine': 4,
        'pour ma femme': 4, 'pour ma soeur': 4, 'pour ma mere': 4, 'pour ma fille': 3, 'pour ma meilleure amie': 4, 'emballage cadeau': 4,
        'paquet cadeau': 4, 'carte cadeau': 4, 'bon cadeau': 4, 'mot doux': 3,
      },
    },
    absorb: {
      family: 'product',
      terms: {
        absorption: 3, absorbe: 3, absorbant: 3, absorbante: 3, flux: 3, abondant: 3, 'flux abondant': 4, 'flux leger': 4, fuite: 3, etanche: 2,
        'combien d heure': 3, capacite: 3, odeur: 3, sent: 2, 'ca tient': 2, 'tient combien': 2, 'toute la journee': 2, 'la nuit': 1, 'combien de temps la garder': 3,
      },
    },
    eco: {
      family: 'product',
      terms: {
        reutilisable: 3, lavable: 2, ecologique: 3, eco: 3, 'zero dechet': 4, 'combien de lavage': 4, 'duree de vie': 4, 'combien de temps dure': 2,
        environnement: 3, planete: 3, jetable: 2, 'combien de fois': 2,
      },
    },
    notSold: {
      family: 'product',
      terms: {
        tampon: 4, cup: 4, 'coupe menstruelle': 4, 'disque menstruel': 4, applicateur: 4, 'protege slip jetable': 4, 'serviette jetable': 4,
        legging: 4, 'maillot de bain': 4, 'maillot menstruel': 4, tisane: 4, cbd: 4, 'patch chauffant': 4, 'huile essentielle': 4, coussin: 3,
        'tens': 3, electrostimulation: 4, 'string': 4, 'brassiere': 4, 'soutien gorge': 4, pyjama: 4, chaussette: 4, 'test de grossesse': 4,
      },
    },

    shipping: {
      family: 'order',
      terms: {
        livraison: 3, 'livr*': 2, expedition: 3, 'expedi*': 2, envoi: 2, envoyer: 2, envoye: 2, colis: 2, 'frais de port': 4, 'frais d envoi': 4,
        'frais de livraison': 4, 'port gratuit': 4, 'livraison gratuite': 4, 'livraison offerte': 4, transporteur: 3, 'la poste': 3, colissimo: 3,
        'mondial relay': 4, 'point relai': 4, relai: 2, chronopost: 3, dhl: 3, ups: 3, express: 3, 'mode de livraison': 4, domicile: 2, 'boite aux lettre': 3,
      },
    },
    delay: {
      family: 'order',
      terms: {
        delai: 3, quand: 1, 'combien de temps': 1, recevoir: 2, recoi: 2, recoit: 2, recevrai: 2, recevrez: 2, arrivera: 2, reception: 2, arrive: 1, arriver: 2, arrivee: 2, 'sous combien': 3, jour: 1,
        semaine: 1, 'je vais recevoir': 4, 'quand vais je': 3, 'quand est ce que je': 2, 'sera livre': 3, 'en combien de temps': 4, rapide: 2,
        'combien de jour': 4, 'combien de temps pour recevoir': 5, 'quel delai': 4, 'avant noel': 2, 'pour quand': 3,
      },
    },
    international: {
      family: 'order',
      terms: {
        belgique: 4, suisse: 4, luxembourg: 4, canada: 4, quebec: 4, allemagne: 4, espagne: 4, italie: 4, europe: 3, etranger: 4, international: 4,
        'dom tom': 4, dom: 3, 'outre mer': 4, martinique: 4, guadeloupe: 4, reunion: 3, guyane: 4, mayotte: 4, corse: 4, monaco: 4, maroc: 4,
        algerie: 4, tunisie: 4, senegal: 4, afrique: 4, usa: 4, 'etats uni': 4, 'royaume uni': 4, angleterre: 4, 'quel pays': 4, 'autre pays': 4,
        'hors de france': 4, 'hors france': 4, 'pays bas': 4, portugal: 4, douane: 4, 'frais de douane': 5,
      },
    },
    tracking: {
      family: 'order',
      terms: {
        suivi: 3, suivre: 3, 'numero de suivi': 4, tracking: 4, 'ou est ma commande': 5, 'ou en est': 4, 'ma commande': 2, statut: 3,
        'etat de ma commande': 4, 'suivre mon colis': 4, 'suivre ma commande': 4, 'lien de suivi': 4,
      },
    },
    late: {
      family: 'order',
      terms: {
        'pas recu': 4, 'toujours pas': 3, 'pas arrive': 4, 'jamais recu': 4, 'rien recu': 4, retard: 3, 'en retard': 4, bloque: 3, perdu: 3,
        'n avance pas': 4, 'n arrive pas': 4, 'toujours rien': 4, 'pas encore recu': 4, 'colis perdu': 5, 'trop long': 3, 'ca fait': 1,
      },
    },
    orderChange: {
      family: 'order',
      terms: {
        annuler: 3, annulation: 3, modifier: 2, 'modifier ma commande': 4, 'changer d adresse': 4, 'changer mon adresse': 4, 'mauvaise adresse': 4,
        'erreur d adresse': 4, 'changer ma commande': 4, 'ajouter a ma commande': 4, 'je me suis trompe': 3, 'je me suis trompee': 3, 'erreur dans ma commande': 4,
      },
    },
    returns: {
      family: 'after',
      terms: {
        retour: 3, retourner: 3, renvoyer: 3, 'rembours*': 3, retractation: 4, 'changer d avis': 4, 'plus envie': 3, 'ne me plait pas': 4,
        'ne me convient pas': 4, 'ca ne me va pas': 4, echange: 3, echanger: 3, 'pas la bonne taille': 4, 'satisfaite ou remboursee': 4,
        'satisfait ou rembourse': 4, 'renvoyer le produit': 4, 'comment faire un retour': 5, 'frais de retour': 4, 'je regrette': 3, essayer: 1,
      },
    },
    guarantee: {
      family: 'after',
      terms: {
        garantie: 3, garanti: 3, '30 jour': 3, 'satisfaite ou remboursee': 3, 'si ca ne marche pas sur moi': 4, 'si ca ne me convient pas': 4,
        'si je ne suis pas satisfaite': 4, 'pas satisfaite': 4, 'pas satisfait': 4, 'combien de temps de garantie': 5,
      },
    },
    defect: {
      family: 'after',
      terms: {
        panne: 4, defectueux: 4, defectueuse: 4, defaut: 3, casse: 3, cassee: 3, 'ne marche pas': 4, 'ne marche plus': 4, 'ne fonctionne pas': 4,
        'ne fonctionne plus': 4, 'ne chauffe pas': 5, 'ne chauffe plus': 5, 'ne s allume pas': 5, 'ne s allume plus': 5, 'ne charge pas': 5,
        'ne se charge pas': 5, 'ne vibre pas': 5, 'ne vibre plus': 5, abime: 4, abimee: 4, endommage: 4, endommagee: 4, 'mauvais etat': 4,
        'pas le bon': 3, 'mauvais produit': 4, manquant: 4, 'il manque': 4, probleme: 2, 'un souci': 2, souci: 2, reparer: 3, reparation: 3,
        'colis abime': 5, ecrase: 3, 'pas conforme': 4, 'non conforme': 4, 'arrive casse': 5,
      },
    },
    payment: {
      family: 'shop',
      terms: {
        paiement: 3, payer: 3, 'carte bancaire': 4, carte: 2, cb: 3, visa: 3, mastercard: 3, paypal: 4, 'apple pay': 4, 'google pay': 4,
        'plusieurs fois': 4, '3 fois': 4, '4 fois': 4, klarna: 4, alma: 4, 'en plusieurs': 3, virement: 3, cheque: 3, espece: 3, 'moyen de paiement': 4,
        'paiement securise': 4, securise: 2, facture: 3, 'payer a la livraison': 5, 'paiement a la livraison': 5, 'contre remboursement': 5, 'shop pay': 4, 'payer en': 3, 'je paie': 3, 'je paye': 3,
      },
    },
    account: { family: 'shop', terms: { compte: 3, 'mon compte': 4, 'creer un compte': 4, connexion: 3, connecter: 3, 'mot de passe': 4, identifiant: 3, historique: 2 } },
    newsletter: { family: 'shop', terms: { newsletter: 4, 's inscrire': 3, inscription: 2, desinscrire: 4, desabonner: 4, 'recevoir vos email': 4, 'vos email': 2 } },
    cookies: { family: 'shop', terms: { cookie: 4, 'mes donnees': 3, 'donnees personnelle': 4, rgpd: 4, confidentialite: 4, 'vie privee': 4, 'supprimer mes donnees': 5 } },
    contact: {
      family: 'shop',
      terms: {
        contact: 3, contacter: 3, joindre: 3, 'parler a quelqu un': 5, 'parler a l equipe': 5, 'ecrire a l equipe': 5, equipe: 2, 'votre equipe': 3, 'parler a une personne': 5, 'une personne': 2, humain: 3, 'service client': 4,
        sav: 3, telephone: 3, appeler: 3, 'numero de telephone': 4, email: 3, 'adresse email': 4, 'e email': 3, ecrire: 2, 'vous ecrire': 3,
        reclamation: 3, 'parler a un conseiller': 5, 'parler a une conseillere': 5, conseillere: 4, 'une vraie personne': 4, 'quelqu un de l equipe': 5, whatsapp: 3, 'par telephone': 4,
      },
    },
    hours: {
      family: 'shop',
      terms: { horaire: 3, 'heure d ouverture': 4, ouvert: 2, 'quand repondez vous': 4, 'delai de reponse': 4, 'vous repondez': 3, dimanche: 2, 'week end': 2, 'repondre vite': 3 },
    },
    brand: {
      family: 'brand',
      terms: {
        velea: 2, marque: 2, 'qui etes vous': 2, entreprise: 3, societe: 3, histoire: 2, 'a propos': 3, fondatrice: 3, createur: 2, creatrice: 3,
        'votre histoire': 4, 'c est quoi velea': 4, 'qui est velea': 4, 'vos valeur': 4, 'votre marque': 4,
      },
    },
    origin: {
      family: 'brand',
      terms: {
        'd ou vient': 4, 'd ou viennent': 4, origine: 3, fabrique: 3, fabrication: 3, fabriquee: 3, 'made in': 4, chine: 3, 'en france': 2,
        francais: 2, francaise: 2, provenance: 3, usine: 3, 'ou est fabrique': 5, 'fabrique ou': 5, 'produit ou': 3, aliexpress: 4, temu: 4, shein: 4, dropshipping: 4,
      },
    },
    trust: {
      family: 'brand',
      terms: {
        arnaque: 4, escroc: 4, escroquerie: 4, fiable: 3, serieux: 3, 'site serieux': 4, confiance: 3, fake: 4, 'faux site': 4, legit: 4,
        'vrai site': 4, 'site fiable': 4, 'je peux vous faire confiance': 5, 'est ce fiable': 4, 'existe vraiment': 4, 'site securise': 4,
      },
    },
    store: {
      family: 'brand',
      terms: { 'vous etes base': 4, 'vous etes basee': 4, 'vous etes situe': 4, 'ou etes vous': 3, 'vous etes ou': 4, 'basee ou': 4, 'base ou': 4, 'boutique physique': 5, magasin: 4, showroom: 4, retrait: 3, 'click and collect': 5, 'venir chercher': 4, 'ou etes vous situe': 4, 'votre adresse': 3, 'sur place': 3 },
    },
    social: { family: 'brand', terms: { instagram: 4, tiktok: 4, facebook: 4, 'reseaux sociaux': 4, reseau: 2, pinterest: 4, youtube: 4, snapchat: 4 } },
    faq: { family: 'brand', terms: { faq: 4, 'questions frequente': 4, 'foire aux questions': 4 } },
  };

  /** Short questions sent by the suggestion buttons (they must read back as their subject). */
  const CHIP = {
    catalogue: 'Voir les produits',
    price: 'Les prix',
    shipping: 'La livraison',
    delay: 'Délai de livraison',
    tracking: 'Suivre ma commande',
    returns: 'Retours et remboursement',
    guarantee: 'La garantie 30 jours',
    defect: 'Un produit abîmé',
    payment: 'Le paiement',
    promo: 'Un code promo ?',
    contact: "Parler à l'équipe",
    howto: "Comment l'utiliser ?",
    care: "L'entretien",
    sizes: 'Guide des tailles',
    colors: 'Les coloris',
    recommend: 'Me conseiller',
    battery: 'La batterie',
    heat: 'La chaleur',
    box: 'Contenu du colis',
    safety: 'Les précautions',
    reviews: 'Les avis',
    cart: 'Voir mon panier',
    gift: 'Une idée cadeau',
  };

  const SUBJECT_LIST = Object.entries(SUBJECTS).map(([id, subject]) => ({
    id,
    family: subject.family,
    terms: Object.entries(subject.terms)
      .filter(([, weight]) => weight > 0)
      .map(([term, weight]) => ({ weight, parts: compile(term) })),
  }));

  for (const subject of SUBJECT_LIST) for (const term of subject.terms) for (const part of term.parts) if (!part.prefix) KNOWN.add(part.text);

  /**
   * Scores every subject in the message. A phrase claims its words: a shorter
   * term inside a longer one found elsewhere does not count again.
   * @param {string[]} tokens
   */
  function analyse(tokens) {
    const hits = [];
    for (const subject of SUBJECT_LIST) {
      for (const term of subject.terms) {
        for (const start of find(tokens, term.parts)) hits.push({ subject, start, length: term.parts.length, weight: term.weight });
      }
    }
    hits.sort((a, b) => b.length - a.length || b.weight - a.weight);
    const claimed = new Array(tokens.length).fill(0);
    const seen = new Map();
    const scores = new Map();
    for (const hit of hits) {
      const span = [];
      for (let i = hit.start; i < hit.start + hit.length; i += 1) span.push(i);
      if (span.some((i) => claimed[i] > hit.length)) continue;
      const counted = seen.get(hit.subject.id) || new Set();
      if (span.every((i) => counted.has(i))) continue;
      for (const i of span) {
        claimed[i] = Math.max(claimed[i], hit.length);
        counted.add(i);
      }
      seen.set(hit.subject.id, counted);
      const entry = scores.get(hit.subject.id) || { id: hit.subject.id, family: hit.subject.family, score: 0, at: hit.start };
      entry.score += hit.weight * (1 + 0.25 * (hit.length - 1));
      entry.at = Math.min(entry.at, hit.start);
      scores.set(hit.subject.id, entry);
    }
    const ranked = [...scores.values()].sort((a, b) => b.score - a.score || a.at - b.at);
    return { ranked, claimed };
  }

  /* ------------------------------------------------------------------ */
  /* The shop's data                                                     */
  /* ------------------------------------------------------------------ */

  /** @param {unknown} value A list, or a text with one item per line */
  function lines(value) {
    if (!value) return [];
    const list = Array.isArray(value) ? value : String(value).split(/\n+/);
    return list.map((line) => String(line).trim()).filter(Boolean);
  }

  /** Lines of a product's details that speak about a subject. */
  const TOPIC = {
    heat: /chaleur|chauff|temperatur|degre|\b50\b|\b60\b/,
    vibration: /vibra|massage|\bm1\b|\bm4\b/,
    battery: /batter|autonom|charg|usb|aliment|voyant|mah|fil\b/,
    timer: /arret|automatiq|minute|pause/,
    measure: /dimension|poids|longueur|\bcm\b/,
    material: /matiere|composition|tissu|coton|viscose|elasth|velours|\babs\b|microfibre|bambou|entrejambe|impermeable|couche/,
    absorb: /flux|absorb|impermeable|etanch|couche|fuite|microfibre/,
    sleep: /sommeil|nuit|dormir/,
    skin: /peau|plaie|irrit|brul|endroit/,
    water: /\beau\b|liquide|humid|mouill/,
    reuse: /reutilis|lavage|lavable|cycle|lav/,
    outside: /exterieur|dehors|maison|sans fil|discret|bouger|mouvement/,
    strap: /sangle|ajust|reglable|elasti/,
    pregnancy: /grossesse|enceinte/,
    contra: /contre indique|grossesse|cardiaque|tumeur|goutte|plaie/,
    medical: /medical|professionnel de sante|avis medical/,
  };

  /**
   * @param {any} product
   * @param {RegExp} regex
   * @param {string[]} [fields]
   */
  function grep(product, regex, fields = ['highlights', 'specs', 'howto', 'care', 'precautions', 'sizes', 'box']) {
    const found = [];
    for (const field of fields) for (const line of lines(product[field])) if (regex.test(fold(line)) && !found.includes(line)) found.push(line);
    return found;
  }

  /** Sentences of the product description that speak about a subject. */
  function describe(product, regex) {
    const text = String(product.description || '');
    return text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence && regex.test(fold(sentence)));
  }

  /** Colour words a visitor may ask for. */
  const COLOURS = new Set(words('rose blanc noir beige rouge gris bleu vert violet jaune orange marron nude bordeaux lilas kaki dore argent creme ivoire'));

  const MASCULINE = new Set(['pack', 'coffret', 'lot', 'kit', 'coussin', 'patch', 'bracelet', 'sac', 'duo', 'set', 'bandeau', 'tapis', 'gel', 'spray', 'baume', 'masseur', 'appareil']);

  /** "Serviettes menstruelles lavables (lot de 5)" → "Serviettes menstruelles lavables" */
  function plainTitle(product) {
    return String(product.title).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  }

  function grammar(product) {
    const first = fold(plainTitle(product)).split(' ')[0] || '';
    const plural = /[sx]$/.test(first) && !INVARIABLE.has(first);
    const masculine = MASCULINE.has(singular(first));
    return { plural, masculine, vowel: /^[aeiouyh]/.test(first) };
  }

  /** "la ceinture menstruelle", "les serviettes…", "l'oreiller" */
  function the(product, capital = false) {
    const { plural, masculine, vowel } = grammar(product);
    const title = plainTitle(product);
    const lower = title.charAt(0).toLowerCase() + title.slice(1);
    let text;
    if (plural) text = `les ${lower}`;
    else if (vowel) text = `l'${lower}`;
    else text = `${masculine ? 'le' : 'la'} ${lower}`;
    return capital ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  /** "La ceinture", "Les serviettes": the label of a suggestion button. */
  function shortName(product) {
    const { plural, masculine, vowel } = grammar(product);
    const first = plainTitle(product).split(' ')[0];
    const lower = first.charAt(0).toLowerCase() + first.slice(1);
    if (plural) return `Les ${lower}`;
    if (vowel) return `L'${lower}`;
    return `${masculine ? 'Le' : 'La'} ${lower}`;
  }

  /** elle / elles / il / ils */
  function pronoun(product) {
    const { plural, masculine } = grammar(product);
    return `${masculine ? 'il' : 'elle'}${plural ? 's' : ''}`;
  }

  /** Words that name each product, built from its title and type, plus everyday names. */
  const FAMILIES = {
    ceinture: ['ceinture', 'ceinture chauffante', 'ceinture menstruelle', 'ceinture de regle', 'chauffante', 'chauffant', 'bouillotte', 'appareil', 'boitier', 'ceinture electrique'],
    culotte: ['culotte', 'culotte menstruelle', 'culotte de regle', 'slip', 'shorty', 'sous vetement', 'lingerie', 'boxer', 'culotte lavable'],
    serviette: ['serviette', 'serviette lavable', 'serviette hygienique', 'serviette menstruelle', 'protege slip', 'protection lavable', 'lot de 5', 'serviette reutilisable'],
  };
  const GENERIC = new Set(words('menstruelle menstruel lavable lavables lot de 5 regles regle la le les des du a pour femme'));

  function productTerms(products) {
    const count = new Map();
    const own = products.map((product) => {
      const set = new Set(words(`${plainTitle(product)} ${product.type || ''} ${String(product.handle).replace(/-/g, ' ')}`).filter((w) => w.length > 2 && !GENERIC.has(w)));
      for (const word of set) count.set(word, (count.get(word) || 0) + 1);
      return set;
    });
    return products.map((product, index) => {
      const terms = [...own[index]].filter((word) => count.get(word) === 1);
      for (const [root, names] of Object.entries(FAMILIES)) if (own[index].has(root)) terms.push(...names);
      return { product, terms: [...new Set(terms)].map((term) => compile(term)) };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Writing answers                                                     */
  /* ------------------------------------------------------------------ */

  class Reply {
    constructor() {
      /** @type {any[]} */
      this.parts = [];
      /** @type {string[]} */
      this.chips = [];
      this.expect = null;
      /** Sentences already said in this answer: two subjects never repeat one. */
      this.said = new Set();
    }

    /** @param {string} text */
    #fresh(text) {
      const kept = String(text)
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => {
          const key = fold(sentence);
          if (key.length > 12 && this.said.has(key)) return false;
          this.said.add(key);
          return true;
        });
      return kept.join(' ');
    }

    text(...sentences) {
      const text = this.#fresh(sentences.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim());
      if (text) this.parts.push({ type: 'text', text });
      return this;
    }

    list(items) {
      const clean = [...new Set(items.filter(Boolean))];
      if (clean.length) this.parts.push({ type: 'list', items: clean });
      return this;
    }

    products(list) {
      const handles = list.filter(Boolean).map((product) => product.handle);
      if (handles.length) this.parts.push({ type: 'products', handles: [...new Set(handles)] });
      return this;
    }

    link(label, url) {
      if (url) this.parts.push({ type: 'link', label, url });
      return this;
    }

    action(action, label, extra = {}) {
      this.parts.push({ type: 'action', action, label, ...extra });
      return this;
    }

    note(text) {
      const fresh = text ? this.#fresh(text) : '';
      if (fresh) this.parts.push({ type: 'note', text: fresh });
      return this;
    }

    chip(...labels) {
      for (const label of labels) if (label && !this.chips.includes(label) && this.chips.length < 4) this.chips.push(label);
      return this;
    }

    get length() {
      return this.parts.reduce((total, part) => total + JSON.stringify(part).length, 0);
    }
  }

  const PAYMENT_NAMES = {
    visa: 'Visa', master: 'Mastercard', american_express: 'American Express', paypal: 'PayPal', apple_pay: 'Apple Pay', google_pay: 'Google Pay',
    shopify_pay: 'Shop Pay', klarna: 'Klarna', maestro: 'Maestro', cartes_bancaires: 'Cartes Bancaires', bancontact: 'Bancontact', ideal: 'iDEAL',
    diners_club: 'Diners Club', discover: 'Discover', jcb: 'JCB', unionpay: 'UnionPay', sofort: 'Sofort', alma: 'Alma', samsung_pay: 'Samsung Pay',
  };

  /** "a, b et c" */
  function join(items) {
    const list = items.filter(Boolean);
    if (list.length <= 1) return list.join('');
    return `${list.slice(0, -1).join(', ')} et ${list[list.length - 1]}`;
  }

  /** First sentence of a text. */
  function firstSentence(text) {
    const match = String(text || '').match(/^.*?[.!?](\s|$)/);
    return (match ? match[0] : String(text || '')).trim();
  }

  /** Lower-case first letter, for a setting value used inside a sentence. */
  function inline(text) {
    const value = String(text || '').trim().replace(/[.!]$/, '');
    if (/^[A-Z]{2}/.test(value)) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  class Brain {
    /**
     * @param {any} kb The shop's data (snippets/assistant-knowledge.liquid)
     */
    constructor(kb) {
      this.kb = kb || {};
      this.products = (this.kb.products || []).filter((product) => product && product.handle);
      this.currency = this.kb.currency || 'EUR';
      this.names = productTerms(this.products);
      // Option words only one product has ("duo"), not sizes or colours: they are too common.
      const optionWords = this.products.map((product) => new Set((product.options || [])
        .filter((option) => !/couleur|coloris|color|taille|size/.test(fold(option.name)))
        .flatMap((option) => option.values.flatMap((value) => words(value)))
        .filter((word) => word.length >= 3 && !/\d/.test(word) && !GENERIC.has(word) && !STOP.has(word))));
      this.optionNames = this.products.map((product, index) => ({
        product,
        options: new Set([...optionWords[index]].filter((word) => optionWords.filter((set) => set.has(word)).length === 1 && !this.names.some(({ terms }) => terms.some((parts) => parts.length === 1 && parts[0].text === word)))),
      }));
      this.facts = this.kb.facts || {};
      this.answers = this.kb.answers || {};
      this.urls = this.kb.urls || {};
    }

    /* -------------------------------------------------------------- data */

    product(handle) {
      return this.products.find((product) => product.handle === handle) || null;
    }

    money(cents) {
      try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: this.currency }).format(cents / 100).replace(/[  ]/g, ' ');
      } catch (error) {
        return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
      }
    }

    /**
     * Products named in the message, in the order they appear. Without a
     * name, an option only one product has points to it ("le Duo").
     */
    named(tokens) {
      const found = [];
      for (const { product, terms } of this.names) {
        let at = Infinity;
        for (const parts of terms) for (const start of find(tokens, parts)) at = Math.min(at, start);
        if (at < Infinity) found.push({ product, at });
      }
      if (!found.length) {
        for (const { product, options } of this.optionNames) {
          const at = tokens.findIndex((token) => options.has(token));
          if (at >= 0) found.push({ product, at });
        }
        if (found.length > 1) return [];
      }
      return found.sort((a, b) => a.at - b.at).map((entry) => entry.product);
    }

    optionIndex(product, regex) {
      return (product.options || []).findIndex((option) => regex.test(fold(option.name)));
    }

    /** How many items a value of an option holds: "Duo · 2 ceintures" → 2. */
    quantity(value) {
      const text = fold(value);
      const digits = text.match(/\b(\d+)\b/);
      if (digits) return Number(digits[1]);
      if (/\bduo\b|\bpaire\b/.test(text)) return 2;
      if (/\btrio\b/.test(text)) return 3;
      return 1;
    }

    /** Index of an option whose values hold different quantities (1 belt / Duo). */
    quantityOption(product) {
      return (product.options || []).findIndex((option) => {
        const counts = new Set(option.values.map((value) => this.quantity(value)));
        return counts.size > 1 && counts.has(1);
      });
    }

    /**
     * One entry per pack size (1 belt, Duo…): price, unit price and saving.
     * @returns {{ value: string, price: string, count: number, unit: string, saving: string | null }[]}
     */
    packs(product) {
      const variants = product.variants || [];
      const index = this.quantityOption(product);
      if (index < 0 || !variants.length) return [];
      const singles = variants.filter((variant) => this.quantity(variant.options[index]) === 1).map((variant) => variant.cents);
      const single = singles.length ? Math.min(...singles) : NaN;
      return product.options[index].values.map((value) => {
        const matching = variants.filter((variant) => variant.options[index] === value);
        if (!matching.length) return null;
        const cents = Math.min(...matching.map((variant) => variant.cents));
        const count = this.quantity(value);
        const saving = count > 1 && Number.isFinite(single) ? single * count - cents : 0;
        return { value, price: this.money(cents), count, unit: this.money(Math.round(cents / count)), saving: saving > 0 ? this.money(saving) : null };
      }).filter(Boolean);
    }

    /** Price lines: one per pack size when there are several, with the saving. */
    priceLines(product) {
      const packs = this.packs(product);
      if (!packs.length) {
        if (product.varies) return [`${plainTitle(product)} : de ${product.price} à ${product.priceMax}, selon l'option choisie`];
        return [`${product.title} : ${product.price}`];
      }
      return packs.map((pack) => {
        if (pack.count === 1) return `${pack.value} : ${pack.price}`;
        return `${pack.value} : ${pack.price}, soit ${pack.unit} l'unité${pack.saving ? ` (${pack.saving} d'économie)` : ''}`;
      });
    }

    /** The largest pack, when buying more costs less per item. */
    packDeal(product) {
      const packs = this.packs(product).filter((pack) => pack.count > 1);
      return packs.length ? packs[packs.length - 1] : null;
    }

    /** Whether a product's own details (not its care or warnings) speak about a subject. */
    has(product, topic) {
      return grep(product, TOPIC[topic], ['highlights', 'specs', 'howto']).length > 0;
    }

    /** Products a subject applies to, from their data. */
    applicable(subject) {
      const rules = {
        sizes: (p) => lines(p.sizes).length > 0 || this.optionIndex(p, /taille|size/) >= 0 || this.has(p, 'strap'),
        care: (p) => lines(p.care).length > 0,
        howto: (p) => lines(p.howto).length > 0,
        heat: (p) => this.has(p, 'heat'),
        vibration: (p) => this.has(p, 'vibration'),
        battery: (p) => this.has(p, 'battery'),
        timer: (p) => this.has(p, 'timer'),
        safety: (p) => lines(p.precautions).length > 0,
        colors: (p) => this.optionIndex(p, /couleur|coloris|color/) >= 0,
        box: (p) => lines(p.box).length > 0,
        specs: (p) => lines(p.specs).length > 0,
        absorb: (p) => this.has(p, 'absorb') && !this.has(p, 'heat'),
        eco: (p) => this.has(p, 'reuse') && !this.has(p, 'heat'),
        discreet: (p) => this.has(p, 'outside') || describe(p, TOPIC.outside).length > 0,
        effect: (p) => this.has(p, 'heat'),
        pain: (p) => this.has(p, 'heat'),
      };
      const rule = rules[subject];
      return rule ? this.products.filter(rule) : this.products;
    }

    /* --------------------------------------------------------- the turn */

    /**
     * Opening message, depending on the page. Null: the merchant's own greeting.
     * @param {any} state
     */
    greet(state = {}) {
      const page = this.kb.page || {};
      const product = page.type === 'product' ? this.product(page.product) : null;
      const reply = new Reply();
      if (product) {
        reply.text(`Bonjour ! Une question sur ${the(product)} ? Prix, utilisation, livraison : je vous réponds tout de suite.`);
        reply.chip('Combien ça coûte ?', CHIP.howto, CHIP.shipping, "L'ajouter au panier");
        return { parts: reply.parts, chips: reply.chips, state: { ...this.fresh(state), product: product.handle } };
      }
      if (page.type === 'cart') {
        reply.text('Bonjour ! Une question avant de valider votre panier ? Livraison, paiement, retours : je suis là.');
        reply.chip(CHIP.shipping, CHIP.payment, CHIP.returns, CHIP.promo);
        return { parts: reply.parts, chips: reply.chips, state: this.fresh(state) };
      }
      return null;
    }

    fresh(state = {}) {
      return { turns: 0, product: null, expect: null, last: null, name: state.name || null, greeted: false };
    }

    /**
     * Answers one message.
     * @param {string} message What the visitor wrote
     * @param {any} [previous] The state returned with the last answer
     * @param {{ offer?: any, chat?: boolean }} [context] What the page offers right now
     * @returns {{ parts: any[], chips: string[], state: any, subjects: string[], confident: boolean }}
     */
    reply(message, previous, context = {}) {
      const state = { ...this.fresh(previous), ...(previous || {}) };
      state.turns = (state.turns || 0) + 1;
      const tokens = words(message);
      // The words naming a product ("ceinture chauffante") are not a question about heat.
      const masked = tokens.slice();
      for (const { terms } of this.names) for (const parts of terms) for (const start of find(tokens, parts)) for (let i = start; i < start + parts.length; i += 1) masked[i] = '_';
      const { ranked, claimed } = analyse(masked);
      const ctx = {
        brain: this,
        raw: String(message || ''),
        tokens,
        ranked,
        claimed,
        state,
        offer: context.offer || null,
        chat: Boolean(context.chat),
        named: this.named(tokens),
        question: /\?\s*$/.test(String(message || '').trim()),
        reply: new Reply(),
        prefix: [],
      };
      this.#understand(ctx);
      const { reply } = ctx;
      if (ctx.prefix.length && reply.parts[0]?.type === 'text') reply.parts[0].text = `${ctx.prefix.join(' ')} ${reply.parts[0].text}`;
      else if (ctx.prefix.length) reply.parts.unshift({ type: 'text', text: ctx.prefix.join(' ') });
      if (!reply.parts.length) this.#fallback(ctx);
      state.expect = reply.expect;
      if (!reply.chips.length) reply.chip(CHIP.catalogue, CHIP.shipping, CHIP.returns, CHIP.contact);
      return { parts: reply.parts, chips: reply.chips, state, subjects: ctx.subjects || [], confident: !ctx.unsure };
    }

    /** Picks the subjects of a message and answers them. */
    #understand(ctx) {
      const { state, ranked, tokens } = ctx;
      const scores = Object.fromEntries(ranked.map((entry) => [entry.id, entry.score]));
      const short = tokens.length <= 6;
      const tiny = tokens.length <= 3;

      // Name given: "je m'appelle Sarah".
      const name = this.#name(ctx.raw);
      if (name) {
        state.name = name;
        ctx.newName = true;
        ctx.prefix.push(`Enchantée, ${name} !`);
      }

      // A pending question first: an option to choose, a yes / no, how she feels.
      if (state.expect && this.#pending(ctx, scores)) return;

      // Social words wrapped around a real question become a short opening.
      const social = new Set(['greet', 'howareyou', 'thanks', 'bye', 'yes', 'no', 'moodGood', 'moodBad', 'laugh', 'name', 'compliment']);
      let strong = ranked.filter((entry) => !social.has(entry.id) && entry.score >= 2);
      // "Aidez-moi à choisir": the real subject, not the request for help.
      if (strong.some((entry) => entry.id !== 'help')) strong = strong.filter((entry) => entry.id !== 'help');
      // "Je prends la ceinture", "je prends le duo rose": a buying word with a product, or its options.
      const current = this.product(state.product) || (this.kb.page?.type === 'product' ? this.product(this.kb.page.product) : null);
      if (!strong.length && scores.buy && (ctx.named.length || (current && Object.keys(this.#readOptions(ctx, current, {})).some((index) => current.options[index].values.length > 1)))) {
        strong = ranked.filter((entry) => entry.id === 'buy');
      }
      // "Ça chauffe à combien ?": "combien" alone is not about money when a detail is asked.
      if (strong.some((entry) => entry.id === 'price') && !/\b(prix|cout\w*|tarif|cher\w*|euro|budget|montant|economi\w*|paye\w*)\b/.test(tokens.join(' ')) && strong.some((entry) => ['heat', 'battery', 'timer', 'vibration', 'sizes', 'absorb', 'eco', 'delay', 'specs'].includes(entry.id))) {
        strong = strong.filter((entry) => entry.id !== 'price');
      }
      // "Délai de rétractation": a return question, not a shipping one.
      if (strong.some((entry) => entry.id === 'returns') && !/\b(livr\w*|recev\w*|recoi\w*|coli|colis|expedi\w*|arriv\w*)\b/.test(tokens.join(' '))) strong = strong.filter((entry) => entry.id !== 'delay');
      // "Payer à la livraison ?": a payment question.
      if (strong.some((entry) => entry.id === 'payment') && /\b(pay\w*|paie\w*|paiement)\b/.test(tokens.join(' '))) strong = strong.filter((entry) => !['shipping', 'delay'].includes(entry.id));
      // "Ça soulage ?": one honest answer, not two.
      if (strong.some((entry) => entry.id === 'effect')) strong = strong.filter((entry) => entry.id !== 'pain');
      // "Combien coûte la livraison ?": the shipping, not the products' prices.
      if (!ctx.named.length && strong.some((entry) => ['shipping', 'delay', 'returns', 'international'].includes(entry.id))) strong = strong.filter((entry) => entry.id !== 'price');
      const greeting = scores.greet && (!strong.length || ranked[0].id === 'greet' || scores.greet >= 2);
      const evening = /\bbonsoir\b/.test(fold(ctx.raw));
      const hello = ctx.newName ? '' : state.name ? `${evening ? 'Bonsoir' : 'Bonjour'} ${state.name} !` : `${evening ? 'Bonsoir' : 'Bonjour'} !`;
      if (tokens.length >= 3 && !strong.every((entry) => ['contact', 'help', 'bot'].includes(entry.id))) state.lastQuestion = ctx.raw.slice(0, 400);

      // "Et la culotte ?", "et en blanc ?": the same question, about something else.
      if (!strong.length && tokens.length <= 6 && this.#followUp(ctx)) return;

      if (strong.length) {
        if (greeting && !state.greeted && hello) ctx.prefix.unshift(hello);
        if (scores.howareyou && this.#howAreYouAllowed(ctx)) ctx.prefix.push('Très bien, merci !');
        if (scores.thanks) ctx.prefix.push('Avec plaisir !');
        state.greeted = state.greeted || Boolean(greeting);
        this.#answerSubjects(ctx, strong);
        return;
      }

      // Small talk only.
      const top = ranked[0];
      if (!top) {
        if (ctx.named.length) return this.#about(ctx, ctx.named);
        return;
      }
      if (scores.howareyou && this.#howAreYouAllowed(ctx)) {
        if (greeting && !state.greeted && hello) ctx.prefix.unshift(hello);
        state.greeted = true;
        return this.#howAreYou(ctx);
      }
      if (scores.greet && greeting && ctx.named.length) {
        state.greeted = true;
        if (hello) ctx.prefix.unshift(hello);
        return this.#about(ctx, ctx.named);
      }
      if (scores.greet && greeting) {
        state.greeted = true;
        return this.#greet(ctx, hello);
      }
      if (ctx.named.length) return this.#about(ctx, ctx.named);
      const handlers = {
        thanks: () => this.#thanks(ctx),
        bye: () => this.#bye(ctx),
        moodGood: () => (short ? this.#feeling(ctx, true) : null),
        moodBad: () => (short ? this.#feeling(ctx, false) : null),
        yes: () => (short ? this.#yes(ctx) : null),
        no: () => (short ? this.#no(ctx) : null),
        laugh: () => this.#laugh(ctx),
        compliment: () => this.#compliment(ctx),
        name: () => this.#greet(ctx, ''),
      };
      for (const entry of ranked) {
        const handler = handlers[entry.id];
        if (handler && handler() !== null && ctx.reply.parts.length) return;
      }
      if (tiny && ranked.some((entry) => entry.id === 'yes')) return this.#yes(ctx);
    }

    /**
     * A short message naming another product or option after a question
     * about one: the same question again.
     * @returns {boolean}
     */
    #followUp(ctx) {
      const { state } = ctx;
      const repeatable = ['price', 'stock', 'colors', 'sizes', 'specs', 'heat', 'vibration', 'battery', 'timer', 'howto', 'care', 'box', 'safety', 'reviews', 'absorb', 'eco'];
      if (ctx.named.length && state.last && repeatable.includes(state.last)) {
        state.product = ctx.named[0].handle;
        this.#run(ctx, state.last, ctx.named);
        return ctx.reply.parts.length > 0;
      }
      const product = this.product(state.product) || (this.kb.page?.type === 'product' ? this.product(this.kb.page.product) : null);
      if (!product || ctx.named.length) return false;
      const chosen = this.#readOptions(ctx, product, {});
      const picked = Object.entries(chosen).filter(([index]) => product.options[index].values.length > 1);
      if (!picked.length) return false;
      const colour = this.optionIndex(product, /couleur|coloris|color/);
      const colours = picked.filter(([index]) => Number(index) === colour).map(([, value]) => value.toLowerCase());
      if (colours.length) ctx.prefix.push(`Oui, ${the(product)} existe en ${join(colours)}.`);
      this.#buy(ctx, product, chosen);
      return true;
    }

    #howAreYouAllowed(ctx) {
      const text = ` ${ctx.tokens.join(' ')} `;
      if (/ comment (allez vous|vas tu|va tu|tu vas|tu va|ca va) | tu vas? bien | vous allez bien | quoi de neuf | bien ou quoi /.test(text)) return true;
      // "ça va ?" alone (or with a greeting / a name), not "ça va chauffer ?"
      const rest = ctx.tokens.filter((token) => !['ca', 'va', 'et', 'toi', 'vous', 'bonjour', 'salut', 'coucou', 'hello', 'bonsoir', 'madame', 're', 'oui', 'merci', 'bien', 'tres'].includes(token));
      return /\bca va\b/.test(text) && rest.length <= 1;
    }

    /** "je m'appelle Sarah" → "Sarah" */
    #name(raw) {
      const match = String(raw).match(/(?:je m['’ ]?appelle|moi c['’ ]?est|mon pr[ée]nom (?:est|c['’ ]?est)|mon nom (?:est|c['’ ]?est))\s+([A-Za-zÀ-ÖØ-öø-ÿ-]{2,20})/i);
      if (!match) return null;
      const word = match[1];
      if (STOP.has(fold(word)) || /^(la|le|une|un|pas|quoi|comment)$/i.test(word)) return null;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    /**
     * Follows up on what the assistant just asked.
     * @returns {boolean} true when the message was its answer
     */
    #pending(ctx, scores) {
      const { state } = ctx;
      const expect = state.expect;
      state.expect = null;
      const strongOther = ctx.ranked.find((entry) => !['yes', 'no', 'moodGood', 'moodBad', 'thanks', 'greet', 'howareyou', 'laugh', 'buy'].includes(entry.id) && entry.score >= 3);

      if (expect.type === 'option') {
        const product = this.product(expect.handle);
        if (!product) return false;
        const chosen = this.#readOptions(ctx, product, { ...expect.chosen }, expect.index);
        const progressed = Object.keys(chosen).length > Object.keys(expect.chosen || {}).length;
        if (progressed) {
          this.#buy(ctx, product, chosen);
          return true;
        }
        if (scores.no && ctx.tokens.length <= 3) {
          ctx.reply.text('Pas de souci. Je reste là si vous avez une autre question.').chip(CHIP.catalogue, CHIP.shipping, CHIP.contact);
          return true;
        }
        if (!ctx.ranked.length && !ctx.named.length && ctx.tokens.length <= 3) {
          const option = product.options[expect.index];
          ctx.reply.text(`Ce choix n'existe pas pour ${the(product)}. ${option.name} : ${join(option.values)}.`);
          ctx.reply.chips = option.values.slice(0, 8);
          ctx.reply.expect = expect;
          return true;
        }
        return false;
      }

      if (expect.type === 'confirm') {
        if (strongOther) return false;
        if (scores.yes || scores.moodGood || scores.buy) {
          const product = this.product(expect.handle);
          if (expect.action === 'buy' && product) this.#buy(ctx, product, this.#readOptions(ctx, product, {}));
          else if (expect.action === 'offer') this.#offerAction(ctx);
          else if (expect.action === 'contact') this.#contact(ctx, true);
          else if (expect.action === 'recommend') this.#recommend(ctx);
          else return false;
          return true;
        }
        if (scores.no) {
          ctx.reply.text('Très bien ! Une autre question ? Je suis là.').chip(CHIP.catalogue, CHIP.shipping, CHIP.returns, CHIP.contact);
          return true;
        }
        return false;
      }

      if (expect.type === 'feeling') {
        if (scores.moodBad || scores.pain) {
          if (scores.pain && scores.pain >= 3) return false;
          this.#feeling(ctx, false);
          return true;
        }
        if ((scores.moodGood || scores.yes || scores.howareyou || scores.thanks) && !strongOther && !ctx.named.length) {
          this.#feeling(ctx, true);
          return true;
        }
        if (ctx.named.length && !strongOther) {
          ctx.prefix.push('Excellent choix !');
          this.#about(ctx, ctx.named);
          return true;
        }
        return false;
      }

      if (expect.type === 'product') {
        if (ctx.named.length && !strongOther) {
          state.product = ctx.named[0].handle;
          this.#run(ctx, expect.subject, ctx.named);
          return true;
        }
        return false;
      }

      if (expect.type === 'recommend') {
        const text = fold(ctx.raw);
        if (/chaleur|chaud|chauff|douleur|mal|crampe|ventre/.test(text)) {
          const products = this.applicable('heat');
          if (products.length) {
            ctx.prefix.push('Alors je vous conseille :');
            this.#about(ctx, [products[0]]);
            return true;
          }
        }
        if (/lavable|protection|culotte|serviette|flux|ecolo|reutilis|jetable/.test(text)) {
          this.#compareProtections(ctx);
          return true;
        }
        if (/cadeau|offrir/.test(text)) {
          this.#gift(ctx);
          return true;
        }
        return false;
      }
      return false;
    }

    /** Answers up to two subjects of a message (the second only when clearly asked too). */
    #answerSubjects(ctx, strong) {
      const order = strong.slice().sort((a, b) => b.score - a.score || a.at - b.at);
      const chosen = [order[0]];
      for (const entry of order.slice(1)) {
        if (chosen.length >= 2) break;
        if (entry.score < 3) continue;
        if (chosen.some((other) => other.family === entry.family && !this.#distinct(other.id, entry.id))) continue;
        chosen.push(entry);
      }
      // Keep them in the order she asked.
      chosen.sort((a, b) => a.at - b.at);
      ctx.subjects = chosen.map((entry) => entry.id);
      for (const entry of chosen) this.#run(ctx, entry.id, ctx.named);
      ctx.state.last = chosen[chosen.length - 1].id;
    }

    /** Two subjects of the same family still both answered ("prix et couleurs"). */
    #distinct(a, b) {
      const pairs = [['price', 'colors'], ['price', 'stock'], ['price', 'sizes'], ['shipping', 'returns'], ['delay', 'returns'], ['price', 'shipping'], ['howto', 'care']];
      return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    }

    /**
     * The product a question is about: named, or the one being discussed, or
     * the page's, or the only one the subject applies to.
     */
    #resolve(ctx, subject, named) {
      const pool = this.applicable(subject);
      if (named.length) return named.filter((product) => pool.includes(product)).length ? named.filter((product) => pool.includes(product)) : named;
      const recent = this.product(ctx.state.product);
      if (recent && pool.includes(recent)) return [recent];
      const page = this.kb.page?.type === 'product' ? this.product(this.kb.page.product) : null;
      if (page && pool.includes(page)) return [page];
      if (pool.length === 1) return pool;
      return [];
    }

    #run(ctx, subject, named) {
      const answers = {
        product: () => (named.length ? this.#about(ctx, named) : this.#catalogue(ctx)),
        catalogue: () => this.#catalogue(ctx),
        recommend: () => this.#recommend(ctx),
        buy: () => this.#buyStart(ctx, named),
        cart: () => this.#cart(ctx),
        price: () => this.#price(ctx, named),
        promo: () => this.#promo(ctx),
        stock: () => this.#stock(ctx, named),
        colors: () => this.#colors(ctx, named),
        sizes: () => this.#sizes(ctx, named),
        specs: () => this.#specs(ctx, named),
        heat: () => this.#detail(ctx, named, 'heat'),
        vibration: () => this.#detail(ctx, named, 'vibration'),
        battery: () => this.#battery(ctx, named),
        timer: () => this.#detail(ctx, named, 'timer'),
        howto: () => this.#howto(ctx, named),
        care: () => this.#care(ctx, named),
        box: () => this.#box(ctx, named),
        safety: () => this.#safety(ctx, named),
        health: () => this.#health(ctx),
        pain: () => this.#pain(ctx),
        effect: () => this.#effect(ctx, named),
        reviews: () => this.#reviews(ctx, named),
        discreet: () => this.#discreet(ctx, named),
        gift: () => this.#gift(ctx),
        absorb: () => this.#absorb(ctx, named),
        eco: () => this.#eco(ctx, named),
        notSold: () => this.#notSold(ctx),
        shipping: () => this.#shipping(ctx),
        delay: () => this.#delay(ctx),
        international: () => this.#international(ctx),
        tracking: () => this.#tracking(ctx),
        late: () => this.#late(ctx),
        orderChange: () => this.#orderChange(ctx),
        returns: () => this.#returns(ctx),
        guarantee: () => this.#guarantee(ctx),
        defect: () => this.#defect(ctx),
        payment: () => this.#payment(ctx),
        account: () => this.#account(ctx),
        newsletter: () => this.#newsletter(ctx),
        cookies: () => this.#cookies(ctx),
        contact: () => this.#contact(ctx),
        hours: () => this.#hours(ctx),
        brand: () => this.#brand(ctx),
        origin: () => this.#origin(ctx),
        trust: () => this.#trust(ctx),
        store: () => this.#store(ctx),
        social: () => this.#social(ctx),
        faq: () => this.#faq(ctx),
        bot: () => this.#bot(ctx),
        help: () => this.#help(ctx),
        insult: () => this.#insult(ctx),
        joke: () => this.#joke(ctx),
        personal: () => this.#personal(ctx),
        weather: () => this.#weather(ctx),
        compliment: () => this.#compliment(ctx),
      };
      const answer = answers[subject];
      if (answer) answer();
    }

    /* ---------------------------------------------------- small talk */

    #greet(ctx, hello) {
      const page = this.kb.page || {};
      const product = page.type === 'product' ? this.product(page.product) : null;
      const opening = ctx.newName ? '' : hello || 'Bonjour !';
      if (product) {
        ctx.reply.text(opening, `Ravie de vous accueillir. Une question sur ${the(product)} ? Je vous réponds tout de suite.`);
        ctx.reply.chip('Combien ça coûte ?', CHIP.howto, CHIP.shipping, "L'ajouter au panier");
        ctx.state.product = product.handle;
        return;
      }
      ctx.reply.text(opening, 'Ravie de vous accueillir chez VELEA. Comment puis-je vous aider ?', this.#rangeSentence());
      ctx.reply.chip(CHIP.catalogue, CHIP.recommend, CHIP.shipping, CHIP.promo);
    }

    #rangeSentence() {
      if (!this.products.length) return '';
      const names = this.products.slice(0, 3).map((product) => shortName(product).toLowerCase());
      return `Je vous renseigne sur ${join(names)}, votre commande, la livraison et les retours.`;
    }

    #howAreYou(ctx) {
      const lines = [
        'Très bien, merci ! Et vous ?',
        'Je vais très bien, merci ! Et vous, comment allez-vous ?',
      ];
      const text = lines[ctx.state.turns % lines.length];
      ctx.reply.text(text, 'Dites-moi : quel article souhaitez-vous découvrir aujourd’hui ?');
      for (const product of this.products.slice(0, 3)) ctx.reply.chip(shortName(product));
      ctx.reply.chip(CHIP.recommend);
      ctx.reply.expect = { type: 'feeling' };
    }

    #feeling(ctx, good) {
      if (good) {
        ctx.reply.text(ctx.state.name ? `Tant mieux, ${ctx.state.name} !` : 'Tant mieux, ça fait plaisir !', 'Quel article vous ferait plaisir : je vous le présente en détail ?');
        for (const product of this.products.slice(0, 3)) ctx.reply.chip(shortName(product));
        ctx.reply.chip(CHIP.recommend);
        return;
      }
      const heat = this.applicable('heat')[0];
      ctx.reply.text('Oh, je suis désolée. J’espère que la journée va s’adoucir.');
      if (heat) {
        ctx.reply.text(`Si ce sont vos règles qui vous fatiguent, une chaleur douce sur le bas du ventre est un geste de confort très répandu : c'est tout le principe de ${the(heat)}.`);
        ctx.reply.chip(shortName(heat));
      }
      ctx.reply.chip(CHIP.recommend, CHIP.catalogue);
    }

    #thanks(ctx) {
      const options = [
        'Avec grand plaisir ! Une autre question ? Je suis là.',
        'Je vous en prie ! N’hésitez pas si vous avez besoin d’autre chose.',
        'Avec plaisir ! Je reste là si besoin.',
      ];
      ctx.reply.text(options[ctx.state.turns % options.length]);
      ctx.reply.chip(CHIP.catalogue, CHIP.cart, CHIP.shipping);
    }

    #bye(ctx) {
      const name = ctx.state.name ? `, ${ctx.state.name}` : '';
      ctx.reply.text(`Au revoir${name}, et merci de votre visite ! Je reste ici si vous avez la moindre question.`);
      ctx.reply.chip(CHIP.cart, CHIP.catalogue);
    }

    #yes(ctx) {
      ctx.reply.text('Parfait ! Dites-moi ce qui vous ferait plaisir : un produit, la livraison, votre commande…');
      ctx.reply.chip(CHIP.catalogue, CHIP.recommend, CHIP.shipping, CHIP.promo);
    }

    #no(ctx) {
      ctx.reply.text('Très bien. Je reste là si vous avez une question, à tout moment.');
      ctx.reply.chip(CHIP.catalogue, CHIP.shipping, CHIP.contact);
    }

    #laugh(ctx) {
      ctx.reply.text('Ravie de vous faire sourire ! Je peux vous aider pour autre chose ?');
      ctx.reply.chip(CHIP.catalogue, CHIP.promo, CHIP.shipping);
    }

    #compliment(ctx) {
      ctx.reply.text('Merci beaucoup, ça me touche ! Toute l’équipe VELEA sera ravie de le lire. Je peux vous aider à trouver quelque chose ?');
      ctx.reply.chip(CHIP.catalogue, CHIP.recommend, CHIP.promo);
    }

    #insult(ctx) {
      ctx.reply.text('Je suis désolée de ne pas vous aider comme vous le souhaitez. Dites-moi en quelques mots ce que vous cherchez, je fais de mon mieux.');
      ctx.reply.text('Vous pouvez aussi écrire directement à notre équipe : une personne vous répondra.');
      ctx.reply.action('contact', "Écrire à l'équipe", { question: '' });
      ctx.reply.chip(CHIP.catalogue, CHIP.tracking, CHIP.returns);
    }

    #joke(ctx) {
      ctx.reply.text('Je suis bien meilleure en conseils qu’en blagues, je l’avoue ! En revanche, pour vos jours de règles, je connais tout notre catalogue sur le bout des doigts.');
      ctx.reply.chip(CHIP.catalogue, CHIP.recommend);
    }

    #personal(ctx) {
      ctx.reply.text('Je suis l’assistante VELEA : ma seule passion, c’est de vous aider à trouver votre confort pendant les règles ! Que puis-je faire pour vous ?');
      ctx.reply.chip(CHIP.catalogue, CHIP.recommend, CHIP.shipping);
    }

    #weather(ctx) {
      const heat = this.applicable('heat')[0];
      ctx.reply.text('La météo, ce n’est pas ma spécialité !', heat ? `Mais quel que soit le temps, ${the(heat)} vous garde au chaud quand vous en avez besoin.` : '');
      ctx.reply.chip(heat ? shortName(heat) : CHIP.catalogue, CHIP.catalogue, CHIP.promo);
    }

    #bot(ctx) {
      const title = String(this.kb.assistantName || 'Assistante VELEA');
      const name = /^assistante?\b/i.test(title) ? `l’${title.charAt(0).toLowerCase()}${title.slice(1)}` : `${title}, l’assistante de VELEA`;
      ctx.reply.text(`Je suis ${name} : une assistante automatique, qui répond à partir des informations de la boutique (produits, prix, livraison, retours), à toute heure.`);
      ctx.reply.text('Pour échanger avec une personne de l’équipe, écrivez-nous : nous vous répondons par e-mail.');
      ctx.reply.action('contact', "Écrire à l'équipe", { question: '' });
      ctx.reply.chip(CHIP.catalogue, CHIP.shipping, CHIP.returns);
    }

    #help(ctx) {
      ctx.reply.text('Avec plaisir ! Je peux vous présenter nos produits et leurs prix, vous aider à choisir, vous expliquer comment les utiliser et les entretenir, et répondre sur la livraison, le suivi, le paiement et les retours.');
      ctx.reply.text('Posez votre question avec vos mots, ou choisissez un sujet :');
      ctx.reply.chip(CHIP.catalogue, CHIP.recommend, CHIP.tracking, CHIP.returns);
    }

    /* ------------------------------------------------------- products */

    #card(ctx, products) {
      ctx.reply.products(products);
    }

    #catalogue(ctx) {
      const products = this.products.slice().sort((a, b) => Number(b.available) - Number(a.available));
      if (!products.length) {
        ctx.reply.text('Toute notre sélection est sur la page catalogue.').link('Voir le catalogue', this.urls.catalogue);
        return;
      }
      ctx.reply.text(products.length > 1 ? `Voici nos ${products.length} essentiels :` : 'Voici notre essentiel :');
      this.#card(ctx, products);
      const shipping = this.facts.shipping ? `${this.facts.shipping}.` : '';
      ctx.reply.text(shipping, 'Lequel souhaitez-vous découvrir ?');
      for (const product of products.slice(0, 3)) ctx.reply.chip(shortName(product));
      ctx.reply.chip(CHIP.recommend);
      ctx.reply.expect = { type: 'product', subject: 'product' };
    }

    /** A product presented: tagline, highlights, price, card, and the offer to add it. */
    #about(ctx, products) {
      if (products.length > 1) {
        ctx.reply.text('Voici les produits dont vous parlez :');
        for (const product of products.slice(0, 3)) ctx.reply.text(`${product.title} : ${this.#priceShort(product)}.`, product.tagline || '');
        this.#card(ctx, products.slice(0, 3));
        ctx.reply.chip(CHIP.recommend, CHIP.shipping);
        return;
      }
      const [product] = products;
      ctx.state.product = product.handle;
      ctx.reply.text(product.tagline || `${product.title}.`);
      ctx.reply.list(lines(product.highlights).slice(0, 4));
      const deal = this.packDeal(product);
      ctx.reply.text(`Prix : ${this.#priceShort(product)}.`, deal ? `En ${deal.value} : ${deal.price}, soit ${deal.unit} l'unité.` : '');
      this.#card(ctx, [product]);
      if (product.available) {
        ctx.reply.text('Voulez-vous que je l’ajoute à votre panier ?');
        ctx.reply.expect = { type: 'confirm', action: 'buy', handle: product.handle };
        ctx.reply.chip(`Oui, je ${grammar(product).plural ? 'les' : grammar(product).masculine ? 'le' : 'la'} veux`, CHIP.howto, CHIP.shipping);
      } else {
        ctx.reply.text(`${the(product, true)} ${grammar(product).plural ? 'sont' : 'est'} momentanément indisponible${grammar(product).plural ? 's' : ''}.`);
        ctx.reply.chip(CHIP.catalogue, CHIP.contact);
      }
      for (const other of this.products) if (other !== product) ctx.reply.chip(shortName(other));
    }

    #priceShort(product) {
      const index = this.quantityOption(product);
      if (index >= 0) return `à partir de ${product.price}`;
      if (product.varies) return `de ${product.price} à ${product.priceMax}`;
      return product.price;
    }

    #needProduct(ctx, subject, question) {
      const pool = this.applicable(subject);
      ctx.reply.text(question);
      for (const product of pool.slice(0, 3)) ctx.reply.chip(shortName(product));
      ctx.reply.expect = { type: 'product', subject };
      ctx.unsure = false;
    }

    #price(ctx, named) {
      const products = this.#resolve(ctx, 'price', named);
      if (/si cher|trop cher|pourquoi/.test(fold(ctx.raw))) ctx.prefix.push('Je comprends la question.');
      if (!products.length) {
        ctx.reply.text('Voici nos prix :');
        ctx.reply.list(this.products.flatMap((product) => (this.quantityOption(product) >= 0 ? this.priceLines(product).map((line) => `${plainTitle(product)}, ${line}`) : this.priceLines(product))));
        this.#card(ctx, this.products);
      } else {
        for (const product of products.slice(0, 3)) {
          ctx.state.product = product.handle;
          const priceLines = this.priceLines(product);
          if (priceLines.length > 1) {
            ctx.reply.text(`${the(product, true)} :`);
            ctx.reply.list(priceLines);
          } else {
            ctx.reply.text(`${priceLines[0]}.`);
          }
        }
        this.#card(ctx, products.slice(0, 3));
      }
      if (this.facts.shipping) ctx.reply.note(`${this.facts.shipping}.`);
      const one = products.length === 1 ? products[0] : null;
      if (one?.available) {
        ctx.reply.chip("L'ajouter au panier");
        ctx.reply.expect = { type: 'confirm', action: 'buy', handle: one.handle };
      }
      if (ctx.offer?.percent) ctx.reply.chip(CHIP.promo);
      ctx.reply.chip(CHIP.shipping, CHIP.catalogue);
    }

    #promo(ctx) {
      const offer = ctx.offer;
      if (offer?.percent) {
        const on = offer.label ? ` sur ${inline(offer.label)}` : '';
        const prices = offer.price && offer.newPrice ? ` : ${offer.newPrice} au lieu de ${offer.price}` : '';
        ctx.reply.text(`Oui ! Pour votre première commande, inscrivez-vous à notre newsletter : vous recevez −${offer.percent} %${on}${prices}.`);
        if (offer.conditions) ctx.reply.note(offer.conditions);
        ctx.reply.action('offer', `Recevoir mon code −${offer.percent} %`);
      } else {
        ctx.reply.text('Les offres du moment s’affichent directement sur le site et dans votre panier.');
      }
      for (const product of this.products) {
        const deal = this.packDeal(product);
        if (deal) {
          ctx.reply.text(`Bon à savoir : en ${deal.value}, ${the(product)} revient à ${deal.unit} l'unité${deal.saving ? `, soit ${deal.saving} d'économie` : ''}.`);
          break;
        }
      }
      ctx.reply.chip(CHIP.catalogue, CHIP.price, CHIP.shipping);
    }

    #offerAction(ctx) {
      if (ctx.offer?.percent) {
        ctx.reply.text('Je vous ouvre l’offre de bienvenue :');
        ctx.reply.action('offer', `Recevoir mon code −${ctx.offer.percent} %`);
      } else {
        this.#promo(ctx);
      }
    }

    #stock(ctx, named) {
      const products = this.#resolve(ctx, 'stock', named);
      const list = products.length ? products : this.products;
      const status = (product) => {
        const off = (product.variants || []).filter((variant) => !variant.available).map((variant) => variant.options.filter(Boolean).join(' / '));
        if (!product.available) return `momentanément indisponible`;
        if (off.length) return `disponible, sauf ${join(off)} pour le moment`;
        return `disponible${this.#optionSummary(product)}`;
      };
      if (list.length === 1) {
        const [product] = list;
        ctx.state.product = product.handle;
        const text = status(product);
        ctx.reply.text(`${product.available ? 'Oui, ' : ''}${product.available ? the(product) : the(product, true)} ${grammar(product).plural ? 'sont' : 'est'} ${grammar(product).plural ? text.replace(/^(disponible|indisponible)/, '$1s').replace('momentanément indisponible', 'momentanément indisponibles') : text}.`);
      } else if (list.every((product) => product.available && (product.variants || []).every((variant) => variant.available))) {
        ctx.reply.text('Oui, toute notre sélection est disponible :');
        ctx.reply.list(list.map((product) => `${plainTitle(product)}${this.#optionSummary(product)}`));
      } else {
        ctx.reply.list(list.map((product) => `${plainTitle(product)} : ${status(product)}`));
      }
      if (list.some((product) => !product.available)) {
        ctx.reply.text('Pour savoir quand un article revient, écrivez-nous : notre équipe vous répond.');
        ctx.reply.action('contact', "Écrire à l'équipe", { question: ctx.raw });
      }
      if (list.length === 1 && list[0].available) {
        ctx.reply.chip("L'ajouter au panier");
        ctx.reply.expect = { type: 'confirm', action: 'buy', handle: list[0].handle };
      }
      ctx.reply.chip(CHIP.delay, CHIP.catalogue);
    }

    /** " en rose et blanc" (the colours sold alone, not the pairs of a pack) */
    #optionSummary(product) {
      const index = this.optionIndex(product, /couleur|coloris|color/);
      if (index < 0) return '';
      const values = product.options[index].values.filter((value) => !/\+/.test(value));
      return values.length ? ` en ${join(values.map((value) => value.toLowerCase()))}` : '';
    }

    #colors(ctx, named) {
      const products = this.#resolve(ctx, 'colors', named);
      const list = products.length ? products : this.applicable('colors');
      if (!list.length) {
        ctx.reply.text('Chaque produit est présenté avec ses options sur sa fiche.').link('Voir le catalogue', this.urls.catalogue);
        return;
      }
      const asked = ctx.tokens.filter((token) => COLOURS.has(token));
      for (const product of list.slice(0, 3)) {
        const index = this.optionIndex(product, /couleur|coloris|color/);
        const values = product.options[index].values;
        const plain = values.filter((value) => !/\+/.test(value));
        const pairs = values.filter((value) => /\+/.test(value));
        const offered = new Set(plain.flatMap((value) => words(value)));
        const missing = asked.filter((colour) => !offered.has(colour));
        const found = asked.filter((colour) => offered.has(colour));
        const range = join(plain.map((value) => value.toLowerCase()));
        if (list.length === 1 && missing.length) ctx.reply.text(`Pas en ${join(missing)} : ${the(product)} existe en ${range}.`);
        else if (list.length === 1 && found.length) ctx.reply.text(`Oui ! ${the(product, true)} existe en ${range}.`);
        else ctx.reply.text(`${the(product, true)} existe en ${range}.`);
        const pack = this.packDeal(product);
        if (pairs.length && pack) ctx.reply.text(`En ${pack.value}, vous pouvez aussi associer ${join(pairs.map((value) => value.toLowerCase()))}.`);
      }
      if (list.length === 1) {
        const [product] = list;
        ctx.state.product = product.handle;
        const index = this.optionIndex(product, /couleur|coloris|color/);
        const wanted = product.options[index].values.find((value) => words(value).length === 1 && asked.includes(words(value)[0]));
        this.#card(ctx, [product]);
        if (product.available && wanted) {
          // "Elle existe en noir ?" → yes, and the next choice right away.
          this.#buy(ctx, product, { [index]: wanted });
        } else if (product.available) {
          ctx.reply.text('Laquelle vous fait envie ? Je peux l’ajouter à votre panier.');
          ctx.reply.chips = product.options[index].values.slice(0, 4);
          ctx.reply.expect = { type: 'option', handle: product.handle, chosen: {}, index };
        }
        return;
      }
      this.#card(ctx, list.slice(0, 3));
    }

    #sizes(ctx, named) {
      const products = this.#resolve(ctx, 'sizes', named);
      // Without a product in mind: the products that come in sizes.
      const sized = (product) => this.optionIndex(product, /taille|size/) >= 0 || lines(product.sizes).length > 0;
      const list = products.length ? products : this.applicable('sizes').filter(sized);
      if (!list.length) {
        ctx.reply.text('Les tailles disponibles sont indiquées sur chaque fiche produit.').link('Voir le catalogue', this.urls.catalogue);
        return;
      }
      for (const product of list.slice(0, 2)) {
        const index = this.optionIndex(product, /taille|size/);
        const guide = lines(product.sizes);
        if (index >= 0) {
          const values = product.options[index].values;
          ctx.reply.text(`${the(product, true)} existe du ${values[0]} au ${values[values.length - 1]}${values.length > 2 ? ` (${values.join(', ')})` : ''}.`);
        }
        if (guide.length) {
          ctx.reply.text('Pour trouver la vôtre :');
          ctx.reply.list(guide);
        }
        if (index < 0 && !guide.length) {
          const strap = grep(product, TOPIC.strap, ['howto', 'specs', 'highlights']);
          ctx.reply.text(`${the(product, true)} n'a pas de taille à choisir : ${pronoun(product)} se règle grâce à sa sangle ajustable.`);
          if (strap.length) ctx.reply.note(strap[0]);
          ctx.reply.text('Pour une question précise sur votre tour de taille, notre équipe vous répond.');
          ctx.reply.action('contact', "Demander à l'équipe", { question: ctx.raw });
        }
        ctx.state.product = product.handle;
      }
      const [first] = list;
      if (list.length === 1 && this.optionIndex(first, /taille|size/) >= 0 && first.available) {
        ctx.reply.chip("L'ajouter au panier");
        ctx.reply.expect = { type: 'confirm', action: 'buy', handle: first.handle };
      }
      this.#card(ctx, list.slice(0, 2));
      ctx.reply.chip(CHIP.returns, CHIP.care);
    }

    #specs(ctx, named) {
      const products = this.#resolve(ctx, 'specs', named);
      if (!products.length) return this.#needProduct(ctx, 'specs', 'Avec plaisir ! De quel produit voulez-vous les caractéristiques ?');
      const text = fold(ctx.raw);
      for (const product of products.slice(0, 2)) {
        ctx.state.product = product.handle;
        let found = [];
        if (/poid|pese|dimension|longueur|mesure|taille du boitier/.test(text)) found = grep(product, TOPIC.measure, ['specs']);
        else if (/matiere|composition|tissu|coton|viscose|elasth|velours|plastique|materiau|en quoi/.test(text)) found = grep(product, TOPIC.material, ['specs', 'highlights']);
        if (found.length) {
          ctx.reply.text(`${the(product, true)} :`);
          ctx.reply.list(found);
        } else {
          ctx.reply.text(`Les caractéristiques ${this.#of(product)} :`);
          ctx.reply.list(lines(product.specs));
        }
      }
      this.#card(ctx, products.slice(0, 1));
      ctx.reply.chip(CHIP.howto, CHIP.box, CHIP.price);
    }

    /** "de la ceinture", "des serviettes", "du coussin", "de l'oreiller" */
    #of(product) {
      const text = the(product);
      if (text.startsWith('les ')) return `des ${text.slice(4)}`;
      if (text.startsWith('le ')) return `du ${text.slice(3)}`;
      return `de ${text}`;
    }

    /**
     * A product's facts on a subject: its specifications and instructions
     * first, its highlights only when they say something those do not.
     */
    #facts(product, regex) {
      const precise = [...grep(product, regex, ['specs']), ...grep(product, regex, ['howto'])];
      return precise.length ? precise : grep(product, regex, ['highlights']);
    }

    #detail(ctx, named, topic) {
      const products = this.#resolve(ctx, topic, named);
      if (!products.length) {
        const pool = this.applicable(topic);
        if (!pool.length) return this.#search(ctx);
        return this.#needProduct(ctx, topic, 'De quel produit parlez-vous ?');
      }
      const [product] = products;
      ctx.state.product = product.handle;
      // Heat lines, not the massage line that says "with or without heat".
      const found = this.#facts(product, TOPIC[topic]).filter((line) => topic !== 'heat' || !/vibra|massage/.test(fold(line)));
      const other = this.applicable(topic).find((item) => item !== product);
      if (!found.length && other) {
        const { plural, masculine } = grammar(product);
        const ending = `${masculine ? '' : 'e'}${plural ? 's' : ''}`;
        const lacks = {
          heat: `${plural ? 'ne sont pas' : "n'est pas"} chauffant${ending}`,
          vibration: `${plural ? "n'ont pas" : "n'a pas"} de massage`,
          battery: `${plural ? 'ne fonctionnent pas' : 'ne fonctionne pas'} sur batterie`,
          timer: `${plural ? "n'ont pas" : "n'a pas"} d'arrêt automatique`,
        }[topic];
        ctx.reply.text(`${the(product, true)} ${lacks} : c'est ${the(other)} qui ${topic === 'heat' ? 'chauffe' : 'le propose'}.`);
        this.#card(ctx, [other]);
        ctx.reply.chip(shortName(other), shortName(product));
        return;
      }
      if (!found.length) return this.#search(ctx, product);
      ctx.reply.text(this.#topicIntro(product, topic));
      ctx.reply.list(found.slice(0, 5));
      if (topic === 'heat') {
        const precaution = grep(product, TOPIC.skin, ['precautions'])[0];
        if (precaution) ctx.reply.note(precaution);
      }
      if (topic === 'timer') {
        const sleep = grep(product, TOPIC.sleep, ['precautions'])[0];
        if (sleep) ctx.reply.note(sleep);
      }
      this.#card(ctx, [product]);
      ctx.reply.chip(topic === 'heat' ? CHIP.battery : CHIP.heat, CHIP.howto, CHIP.price);
    }

    #topicIntro(product, topic) {
      const intros = {
        heat: `La chaleur ${this.#of(product)} :`,
        vibration: `Le massage ${this.#of(product)} :`,
        timer: `Côté durée d'utilisation ${this.#of(product)} :`,
        battery: `La batterie ${this.#of(product)} :`,
      };
      return intros[topic] || `${the(product, true)} :`;
    }

    #battery(ctx, named) {
      const products = this.#resolve(ctx, 'battery', named);
      if (!products.length) return this.#detail(ctx, named, 'battery');
      const [product] = products;
      ctx.state.product = product.handle;
      const found = this.#facts(product, TOPIC.battery);
      const charging = grep(product, /pendant la charge/, ['precautions']);
      ctx.reply.text(this.#topicIntro(product, 'battery'));
      ctx.reply.list([...found, ...charging].slice(0, 6));
      if (/chargeur|adaptateur|secteur|prise|fourni|inclu|cable/.test(fold(ctx.raw))) {
        const box = lines(product.box).filter((item) => !/\bduo\b|ensemble/i.test(fold(item)));
        if (box.length) ctx.reply.text(`Dans le colis : ${join(box.map((item) => item.charAt(0).toLowerCase() + item.slice(1)))}.`);
      }
      this.#card(ctx, [product]);
      ctx.reply.chip(CHIP.heat, CHIP.howto, CHIP.box);
    }

    #howto(ctx, named) {
      const products = this.#resolve(ctx, 'howto', named);
      if (!products.length) return this.#needProduct(ctx, 'howto', 'Avec plaisir ! Pour quel produit ?');
      const [product] = products;
      ctx.state.product = product.handle;
      ctx.reply.text(`Pour bien utiliser ${the(product)} :`);
      ctx.reply.list(lines(product.howto));
      const precautions = lines(product.precautions);
      if (precautions.length) ctx.reply.note(precautions[0]);
      ctx.reply.link('Voir la fiche complète', product.url);
      ctx.reply.chip(lines(product.care).length ? CHIP.care : CHIP.safety, CHIP.price, "L'ajouter au panier");
    }

    #care(ctx, named) {
      const products = this.#resolve(ctx, 'care', named);
      if (!products.length) {
        const named0 = named[0] || this.product(ctx.state.product) || (this.kb.page?.type === 'product' ? this.product(this.kb.page.product) : null);
        if (named0) {
          ctx.state.product = named0.handle;
          ctx.reply.text(`Pour l'entretien ${this.#of(named0)}, suivez la notice fournie dans le colis.`);
          const water = grep(named0, TOPIC.water, ['precautions']);
          if (this.has(named0, 'battery')) ctx.reply.text(`C'est un appareil électrique : gardez-${pronoun(named0) === 'il' ? 'le' : 'la'} au sec.`);
          if (water.length) ctx.reply.list(water);
          ctx.reply.chip(CHIP.howto, CHIP.safety);
          return;
        }
        const pool = this.applicable('care');
        if (pool.length > 1) {
          ctx.reply.text('Voici comment les entretenir :');
          for (const product of pool) {
            ctx.reply.text(`${product.title} :`);
            ctx.reply.list(lines(product.care));
          }
          return;
        }
        return this.#needProduct(ctx, 'care', 'Pour quel produit ?');
      }
      const [product] = products;
      ctx.state.product = product.handle;
      ctx.reply.text(`Pour entretenir ${the(product)} :`);
      ctx.reply.list(lines(product.care));
      ctx.reply.chip(CHIP.howto, CHIP.price);
    }

    #box(ctx, named) {
      let products = this.#resolve(ctx, 'box', named);
      // "Chargeur inclus ?": the products that charge.
      if (!products.length && /chargeur|cable|adaptateur|secteur/.test(fold(ctx.raw))) products = this.applicable('battery').slice(0, 1);
      if (!products.length) {
        ctx.reply.text('Dans chaque colis :');
        ctx.reply.list(this.applicable('box').map((product) => `${plainTitle(product)} : ${lines(product.box).map((item) => item.charAt(0).toLowerCase() + item.slice(1)).join(', ')}`));
        ctx.reply.chip(CHIP.delay, CHIP.catalogue);
        return;
      }
      for (const product of products.slice(0, 2)) {
        ctx.state.product = product.handle;
        ctx.reply.text(`Dans le colis ${this.#of(product)} :`);
        ctx.reply.list(lines(product.box));
      }
      ctx.reply.chip(CHIP.howto, CHIP.delay);
    }

    #safety(ctx, named) {
      const products = this.#resolve(ctx, 'safety', named);
      const text = fold(ctx.raw);
      if (!products.length) {
        const pool = this.applicable('safety');
        if (pool.length === 0) return this.#health(ctx);
        products.push(pool[0]);
      }
      const [product] = products;
      ctx.state.product = product.handle;
      const precautions = lines(product.precautions);
      const object = pronoun(product).startsWith('il') ? 'le' : 'la';
      const water = /\beau\b|douche|bain|mouill|etanch|piscine/.test(text);
      let found = [];
      if (/dorm|nuit|sommeil/.test(text)) found = grep(product, TOPIC.sleep, ['precautions']);
      else if (/brul|peau|irrit|allerg/.test(text)) found = grep(product, TOPIC.skin, ['precautions']);
      if (water && this.has(product, 'battery')) {
        ctx.reply.text(`${the(product, true)} est un appareil électrique : gardez-${object} au sec, et retirez-${object} avant la douche ou le bain.`);
        ctx.reply.list(grep(product, TOPIC.water, ['precautions']));
      } else if (found.length && /dorm|nuit|sommeil/.test(text)) {
        // "Peut-on dormir avec ?" → "Non : ne pas utiliser pendant le sommeil."
        const [first, ...rest] = found;
        ctx.reply.text(/^ne pas/i.test(first) ? `Non : ${first.charAt(0).toLowerCase()}${first.slice(1)}` : first);
        ctx.reply.list(rest);
        ctx.reply.text('Les autres précautions sont sur la fiche du produit.');
      } else if (found.length) {
        ctx.reply.text('Pour l’utiliser en toute sérénité, voici les précautions du fabricant :');
        ctx.reply.list(found);
      } else {
        ctx.reply.text(`Les précautions d'emploi ${this.#of(product)} :`);
        ctx.reply.list(precautions);
      }
      if (this.facts.health && !precautions.some((line) => TOPIC.medical.test(fold(line)))) ctx.reply.note(this.facts.health);
      ctx.reply.link('Voir la fiche complète', product.url);
      ctx.reply.chip(CHIP.howto, CHIP.heat);
    }

    #health(ctx) {
      const text = fold(ctx.raw);
      const product = this.applicable('safety')[0];
      const contra = product ? grep(product, TOPIC.contra, ['precautions']) : [];
      const pregnancy = /enceinte|grossesse|allait|bebe|fausse couche|ivg/.test(text);
      const medication = /medicament|doliprane|spasfon|ibuprofene|antidouleur|paracetamol|pilule|ordonnance|traitement/.test(text);
      const young = /\bado\b|adolescente|ma fille|mineure|enfant|\b1[0-7] an/.test(text);
      if (medication) {
        ctx.reply.text('Je ne peux pas vous conseiller sur un médicament ou un traitement : votre pharmacien ou votre médecin sont les mieux placés pour vous répondre.');
      } else if (pregnancy && contra.length) {
        ctx.reply.text(`Je préfère être très claire : d'après le fabricant, ${the(product)} est contre-indiquée dans certains cas.`);
        ctx.reply.list(grep(product, TOPIC.pregnancy, ['precautions']).length ? grep(product, TOPIC.pregnancy, ['precautions']) : contra);
        ctx.reply.text('Pendant une grossesse ou l’allaitement, demandez toujours conseil à votre médecin ou à votre sage-femme.');
      } else if (young) {
        ctx.reply.text('Pour une adolescente, le mieux est de demander conseil à un professionnel de santé, et de lire ensemble les précautions d’emploi.');
        if (contra.length) ctx.reply.list(lines(product.precautions).slice(0, 4));
      } else {
        ctx.reply.text('Je ne peux pas donner d’avis médical : pour votre situation, demandez conseil à votre médecin, votre gynécologue ou votre sage-femme.');
        if (contra.length) {
          ctx.reply.text(`Pour information, d'après le fabricant :`);
          ctx.reply.list(contra);
        }
      }
      if (this.facts.health) ctx.reply.note(this.facts.health);
      if (product) ctx.reply.link('Voir les précautions d’utilisation', product.url);
      ctx.reply.chip(CHIP.safety, CHIP.catalogue, CHIP.contact);
    }

    #pain(ctx) {
      const product = this.applicable('heat')[0];
      ctx.reply.text('Je suis désolée que vous ayez mal.');
      if (product) {
        ctx.state.product = product.handle;
        ctx.reply.text(`Une chaleur douce sur le bas du ventre est un geste de confort très répandu : c'est tout le principe de ${the(product)}.`);
        ctx.reply.list(lines(product.highlights).slice(0, 3));
        this.#card(ctx, [product]);
      }
      if (this.facts.health) ctx.reply.note(this.facts.health);
      if (this.urls.guide) ctx.reply.link('Nos conseils pour les jours de règles', this.urls.guide);
      if (product?.available) {
        ctx.reply.chip("L'ajouter au panier");
        ctx.reply.expect = { type: 'confirm', action: 'buy', handle: product.handle };
      }
      ctx.reply.chip(CHIP.howto, CHIP.price);
    }

    #effect(ctx, named) {
      const products = this.#resolve(ctx, 'effect', named);
      const product = products[0] || named[0] || this.product(ctx.state.product);
      ctx.reply.text('Je préfère être transparente avec vous.');
      if (product) {
        ctx.state.product = product.handle;
        if (this.has(product, 'heat')) {
          const what = describe(product, /chaleur|massage/)[0];
          ctx.reply.text(`${the(product, true)} est un accessoire de confort, pas un traitement.`, what || '');
          if (!what) ctx.reply.list(lines(product.highlights).slice(0, 2));
        } else {
          ctx.reply.text(product.tagline || '');
          ctx.reply.list(lines(product.highlights).slice(0, 3));
        }
        if (product.reviews) ctx.reply.link('Lire les avis de nos clientes', `${product.url}#avis`);
        this.#card(ctx, [product]);
      }
      if (this.facts.returns && (!product || this.has(product, 'heat'))) ctx.reply.text(`Et vous êtes tranquille : ${inline(this.facts.returns)}.`);
      if (this.facts.health && product && this.has(product, 'heat')) ctx.reply.note(this.facts.health);
      ctx.reply.chip(CHIP.guarantee, CHIP.reviews, CHIP.price);
    }

    #reviews(ctx, named) {
      const products = named.length ? named : [this.product(ctx.state.product) || (this.kb.page?.type === 'product' ? this.product(this.kb.page.product) : null)].filter(Boolean);
      const withReviews = this.products.filter((product) => product.reviews);
      const product = products[0];
      if (product && product.reviews) {
        ctx.reply.text(`Les avis de nos clientes sur ${the(product)} sont en bas de sa fiche.`);
        ctx.reply.link('Lire les avis', `${product.url}#avis`);
      } else if (product && withReviews.length) {
        ctx.reply.text(`${the(product, true)} n'a pas encore d'avis publiés sur le site. Ceux de ${the(withReviews[0])} sont en bas de sa fiche.`);
        ctx.reply.link('Lire les avis', `${withReviews[0].url}#avis`);
      } else if (withReviews.length) {
        ctx.reply.text(`Les avis de nos clientes sont en bas de la fiche ${this.#of(withReviews[0])}.`);
        ctx.reply.link('Lire les avis', `${withReviews[0].url}#avis`);
      } else {
        ctx.reply.text('Les avis de nos clientes s’affichent sur les fiches produits.').link('Voir le catalogue', this.urls.catalogue);
      }
      ctx.reply.chip(CHIP.price, CHIP.guarantee);
    }

    #discreet(ctx, named) {
      const products = this.#resolve(ctx, 'discreet', named);
      const product = products[0] || this.applicable('discreet')[0];
      if (!product) return this.#search(ctx);
      ctx.state.product = product.handle;
      const text = fold(ctx.raw);
      const outside = [...grep(product, /sans fil|fil\b/, ['highlights']), ...describe(product, /exterieur|dehors|maison|accompagne/)];
      if (/bruit|bruyant|silenc/.test(text)) {
        ctx.reply.text(`Bonne question. Sur ${the(product)}, chaleur et massage se règlent séparément : vous pouvez profiter de la chaleur seule, sans vibration.`);
        const modes = grep(product, /vibration|massage/, ['highlights', 'howto']);
        if (modes.length) ctx.reply.list(modes.slice(0, 2));
      } else {
        ctx.reply.text(`Oui, ${the(product)} se porte facilement au quotidien :`);
        ctx.reply.list(outside.slice(0, 3));
        const place = grep(product, /vetement|ventre/, ['howto'])[0];
        if (place) ctx.reply.note(place);
      }
      this.#card(ctx, [product]);
      ctx.reply.chip(CHIP.battery, CHIP.price);
    }

    #gift(ctx) {
      const heat = this.applicable('heat')[0];
      ctx.reply.text('Quelle jolie attention !');
      if (heat) {
        const deal = this.packDeal(heat);
        ctx.reply.text(`${the(heat, true)} est une idée cadeau réconfortante.`, deal ? `Avec le ${deal.value} (${deal.price}, soit ${deal.unit} l'unité), gardez-en une et offrez l'autre.` : '');
        this.#card(ctx, [heat]);
        ctx.state.product = heat.handle;
      }
      ctx.reply.text('Pour un mot ou un emballage particulier, écrivez-nous avant de commander : notre équipe vous dira ce qui est possible.');
      ctx.reply.action('contact', "Écrire à l'équipe", { question: ctx.raw });
      ctx.reply.chip(CHIP.price, CHIP.delay, CHIP.catalogue);
    }

    #absorb(ctx, named) {
      const products = this.#resolve(ctx, 'absorb', named);
      const list = products.length ? products : this.applicable('absorb');
      if (!list.length) return this.#search(ctx);
      for (const product of list.slice(0, 2)) {
        const found = [...grep(product, TOPIC.absorb, ['specs', 'highlights']), ...grep(product, /flux|change|ressenti|premiere/, ['howto'])];
        ctx.reply.text(`${the(product, true)} :`);
        ctx.reply.list(found.slice(0, 4));
      }
      ctx.reply.text('Pour une question précise sur votre flux, notre équipe vous répond volontiers.');
      ctx.reply.action('contact', "Demander à l'équipe", { question: ctx.raw });
      this.#card(ctx, list.slice(0, 2));
      ctx.reply.chip(CHIP.care, CHIP.sizes, CHIP.price);
    }

    #eco(ctx, named) {
      const products = this.#resolve(ctx, 'eco', named);
      const list = products.length ? products : this.applicable('eco');
      if (!list.length) return this.#search(ctx);
      ctx.reply.text('Oui : nos protections lavables se réutilisent, cycle après cycle.');
      ctx.reply.list(list.slice(0, 3).map((product) => `${product.title} : ${inline(grep(product, TOPIC.reuse, ['specs'])[0] || product.tagline || '')}`));
      ctx.reply.text('Leur durée de vie dépend de l’entretien : suivez bien les conseils de lavage.');
      this.#card(ctx, list.slice(0, 2));
      ctx.reply.chip(CHIP.care, CHIP.price);
    }

    #notSold(ctx) {
      ctx.reply.text('Nous ne proposons pas cet article. Notre sélection se concentre sur quelques essentiels :');
      this.#card(ctx, this.products);
      ctx.reply.chip(CHIP.recommend, CHIP.catalogue);
    }

    #recommend(ctx) {
      const text = fold(ctx.raw);
      const heat = this.applicable('heat');
      if (/chaleur|chaud|chauff|douleur|mal\b|crampe|ventre/.test(text) && heat.length) {
        ctx.prefix.push('Alors je vous conseille :');
        return this.#about(ctx, [heat[0]]);
      }
      if (/lavable|protection|flux|ecolo|reutilis|jetable/.test(text) || (ctx.named.length > 1 && ctx.named.every((product) => !this.has(product, 'heat')))) {
        return this.#compareProtections(ctx);
      }
      if (/cadeau|offrir/.test(text)) return this.#gift(ctx);
      ctx.reply.text('Avec plaisir ! Pour vous conseiller au mieux : que recherchez-vous ?');
      if (heat.length) ctx.reply.chip('De la chaleur pendant mes règles');
      if (this.applicable('absorb').length) ctx.reply.chip('Une protection lavable');
      ctx.reply.chip('Une idée cadeau', CHIP.catalogue);
      ctx.reply.expect = { type: 'recommend' };
    }

    #compareProtections(ctx) {
      const list = this.applicable('absorb');
      if (!list.length) return this.#catalogue(ctx);
      ctx.reply.text('Nos protections lavables :');
      ctx.reply.list(list.slice(0, 3).map((product) => `${product.title}, ${this.#priceShort(product)} : ${inline(lines(product.howto)[0] || product.tagline || '')}.`));
      if (list.length > 1) ctx.reply.text('Laquelle vous tente ?');
      this.#card(ctx, list.slice(0, 3));
      for (const product of list.slice(0, 3)) ctx.reply.chip(shortName(product));
      ctx.reply.chip(CHIP.care);
      ctx.reply.expect = { type: 'product', subject: 'product' };
    }

    /* ------------------------------------------------------- buying */

    /**
     * Reads the options named in a message ("le duo en rose", "taille M").
     * @param {any} ctx
     * @param {any} product
     * @param {Record<number, string>} chosen
     * @param {number} [asked] The option the assistant just asked for: a bare "M" counts
     */
    #readOptions(ctx, product, chosen, asked = -1) {
      const tokens = ctx.tokens;
      (product.options || []).forEach((option, index) => {
        if (chosen[index] !== undefined) return;
        if (option.values.length === 1) {
          chosen[index] = option.values[0];
          return;
        }
        let best = null;
        let bestSize = 0;
        for (const value of option.values) {
          const valueWords = words(value).filter((word) => word !== '+' && !GENERIC.has(word) && !['ceinture', 'culotte', 'serviette'].includes(word));
          if (!valueWords.length) continue;
          const short = valueWords.every((word) => word.length <= 2) && valueWords.length === 1;
          const matched = valueWords.every((word) => tokens.some((token, i) => {
            if (token !== word && !(word.length >= 5 && same(token, { text: word, prefix: false }))) return false;
            if (!short) return true;
            // "M", "L", "S": only as an answer to a choice, or after "taille" / "en".
            return asked === index || (asked !== -1 && tokens.length <= 2) || ['taille', 'en', 'du'].includes(tokens[i - 1]);
          }));
          if (matched && valueWords.length > bestSize) {
            best = value;
            bestSize = valueWords.length;
          }
        }
        // Pack size by number: "une seule", "à l'unité", "duo", "2".
        if (!best && this.quantityOption(product) === index) {
          const text = ` ${tokens.join(' ')} `;
          const wantsTwo = / (duo|2|paire|deux|lot) /.test(text);
          const wantsOne = / (seule|unite|une seule|1|simple|solo) /.test(text) || (asked === index && / (une|un) /.test(text));
          const target = wantsTwo ? 2 : wantsOne ? 1 : null;
          if (target) best = option.values.find((value) => this.quantity(value) === target) || null;
        }
        if (best) chosen[index] = best;
      });
      return chosen;
    }

    #buyStart(ctx, named) {
      const recent = this.product(ctx.state.product);
      const page = this.kb.page?.type === 'product' ? this.product(this.kb.page.product) : null;
      const product = named[0] || recent || page || (this.products.length === 1 ? this.products[0] : null);
      if (!product) {
        ctx.reply.text('Avec plaisir ! Quel article souhaitez-vous ?');
        this.#card(ctx, this.products);
        for (const item of this.products.slice(0, 3)) ctx.reply.chip(shortName(item));
        ctx.reply.expect = { type: 'product', subject: 'buy' };
        return;
      }
      if (/comment (commander|passer commande|acheter)/.test(fold(ctx.raw))) {
        ctx.reply.text('C’est très simple : choisissez vos options sur la fiche, ajoutez au panier, puis validez votre commande. Je peux aussi l’ajouter pour vous ici.');
      }
      this.#buy(ctx, product, this.#readOptions(ctx, product, {}));
    }

    /**
     * Asks for the next missing option, or shows the "add to cart" button.
     * @param {any} ctx
     * @param {any} product
     * @param {Record<number, string>} chosen
     */
    #buy(ctx, product, chosen) {
      ctx.state.product = product.handle;
      if (!product.available) {
        ctx.reply.text(`${the(product, true)} ${grammar(product).plural ? 'sont' : 'est'} momentanément indisponible${grammar(product).plural ? 's' : ''}. Notre équipe peut vous dire quand ${pronoun(product)} revien${grammar(product).plural ? 'nent' : 't'}.`);
        ctx.reply.action('contact', "Écrire à l'équipe", { question: `Quand ${the(product)} sera-t-${pronoun(product)} de nouveau disponible ?` });
        return;
      }
      const options = product.options || [];
      for (let index = 0; index < options.length; index += 1) {
        if (chosen[index] !== undefined) continue;
        const option = options[index];
        const possible = option.values.filter((value) => (product.variants || []).some((variant) => variant.available && variant.options[index] === value && Object.entries(chosen).every(([i, v]) => variant.options[i] === v)));
        if (possible.length === 1) {
          chosen[index] = possible[0];
          continue;
        }
        const name = option.name.toLowerCase();
        const picked = Object.entries(chosen).filter(([i]) => options[i].values.length > 1).map(([, value]) => value);
        const so = picked.length ? `${picked.join(' · ')} : parfait. ` : 'Avec plaisir ! ';
        ctx.reply.text(`${so}Quel${/^(taille|couleur|offre|option|matiere|forme)/.test(fold(name)) ? 'le' : ''} ${name} souhaitez-vous ?`);
        if (index === this.quantityOption(product)) ctx.reply.list(this.priceLines(product));
        ctx.reply.chips = possible.slice(0, 8);
        ctx.reply.expect = { type: 'option', handle: product.handle, chosen, index };
        return;
      }
      const variant = (product.variants || []).find((item) => options.every((_, index) => item.options[index] === chosen[index]));
      if (!variant) {
        ctx.reply.text('Cette combinaison n’existe pas. Choisissons ensemble :');
        return this.#buy(ctx, product, {});
      }
      if (!variant.available) {
        ctx.reply.text(`${variant.options.filter(Boolean).join(' / ')} est momentanément épuisé. Une autre option ?`);
        return this.#buy(ctx, product, {});
      }
      const label = variant.options.filter(Boolean).filter((value) => options.length > 1 || product.variants.length > 1).join(' · ');
      ctx.reply.text(`Excellent choix ! ${the(product, true)}${label ? `, ${label}` : ''}, à ${variant.price} : un clic et c’est dans votre panier.`);
      ctx.reply.parts.push({ type: 'buy', handle: product.handle, variant: variant.id, label, price: variant.price });
      if (this.facts.shipping) ctx.reply.note(`${this.facts.shipping}.`);
      ctx.reply.chip(CHIP.delay, CHIP.returns);
      if (ctx.offer?.percent && this.#offerFits(ctx, product)) ctx.reply.chip(CHIP.promo);
    }

    #offerFits(ctx, product) {
      return !ctx.offer?.product || ctx.offer.product === product.handle;
    }

    #cart(ctx) {
      ctx.reply.text('Votre panier vous attend : vous pouvez le vérifier puis valider votre commande en toute sécurité.');
      ctx.reply.action('cart', 'Ouvrir mon panier');
      ctx.reply.chip(CHIP.shipping, CHIP.payment, CHIP.promo);
    }

    /* ----------------------------------------------- order & after */

    #shipping(ctx) {
      const text = fold(ctx.raw);
      if (this.answers.shipping) ctx.reply.text(this.answers.shipping);
      else ctx.reply.text(this.facts.shipping ? `${this.facts.shipping}.` : '', this.facts.shippingDelay ? `Comptez ${inline(this.facts.shippingDelay)}.` : '');
      if (/transporteur|poste|colissimo|relay|relai|chronopost|dhl|ups|express|mode|domicile/.test(text)) {
        ctx.reply.text('Les modes de livraison proposés pour votre adresse s’affichent à l’étape du paiement, avant toute validation.');
      }
      if (this.answers.tracking) ctx.reply.text(firstSentence(this.answers.tracking));
      ctx.reply.link('Livraison et retours en détail', this.urls.shipping);
      ctx.reply.chip(CHIP.tracking, CHIP.returns, CHIP.catalogue);
    }

    #delay(ctx) {
      if (this.facts.shippingDelay) {
        const free = this.facts.shipping ? ` ${this.facts.shipping}.` : '';
        ctx.reply.text(`Comptez ${inline(this.facts.shippingDelay)} entre votre commande et la réception.${free}`);
      } else if (this.answers.shipping) {
        ctx.reply.text(this.answers.shipping);
      } else {
        ctx.reply.text('Le délai de livraison s’affiche à l’étape du paiement, avant toute validation.');
      }
      if (this.answers.tracking) ctx.reply.text(firstSentence(this.answers.tracking));
      if (/noel|anniversaire|fete|date|avant le|pour le/.test(fold(ctx.raw))) {
        ctx.reply.text('Pour une date importante, commandez au moins 14 jours ouvrés avant, et écrivez-nous si besoin : notre équipe vous répond.');
      }
      ctx.reply.link('Livraison et retours en détail', this.urls.shipping);
      ctx.reply.chip(CHIP.tracking, CHIP.returns, CHIP.catalogue);
    }

    #international(ctx) {
      const zone = this.answers.shipping ? firstSentence(this.answers.shipping) : this.facts.shipping ? `${this.facts.shipping}.` : '';
      ctx.reply.text(zone, 'Pour une livraison vers un autre pays ou en outre-mer, écrivez-nous avant de commander : notre équipe vous dira si votre adresse peut être livrée, et à quelles conditions.');
      ctx.reply.action('contact', "Demander à l'équipe", { question: ctx.raw });
      ctx.reply.chip(CHIP.delay, CHIP.catalogue);
    }

    #tracking(ctx) {
      if (this.answers.tracking) ctx.reply.text(this.answers.tracking);
      else ctx.reply.text('Dès l’expédition, vous recevez par e-mail votre numéro de suivi.');
      ctx.reply.link('Suivre ma commande', this.urls.tracking);
      if (this.kb.accounts) ctx.reply.link('Mon compte', this.urls.account);
      ctx.reply.chip(CHIP.delay, CHIP.contact, CHIP.returns);
    }

    #late(ctx) {
      const delay = this.facts.shippingDelay ? `Le délai normal est de ${inline(this.facts.shippingDelay)}. ` : '';
      ctx.reply.text(`Je comprends, c'est long d'attendre. ${delay}Vérifiez d'abord l'e-mail d'expédition (pensez aux courriers indésirables) : il contient votre lien de suivi.`);
      ctx.reply.text('Si le délai est dépassé ou si le suivi n’avance plus, écrivez-nous avec votre numéro de commande : nous regardons tout de suite.');
      ctx.reply.action('contact', "Écrire à l'équipe", { question: ctx.raw });
      ctx.reply.link('Suivre ma commande', this.urls.tracking);
      ctx.reply.chip(CHIP.tracking, CHIP.defect);
    }

    #orderChange(ctx) {
      ctx.reply.text('Écrivez-nous au plus vite avec votre numéro de commande et la modification souhaitée : notre équipe regarde ce qui est encore possible avant l’expédition.');
      ctx.reply.action('contact', "Écrire à l'équipe", { question: ctx.raw });
      ctx.reply.chip(CHIP.returns, CHIP.tracking);
    }

    #returns(ctx) {
      if (this.answers.returns) ctx.reply.text(this.answers.returns);
      else if (this.facts.returns) ctx.reply.text(`${this.facts.returns}.`);
      if (this.answers.guarantee && !/retractation|changer d avis/.test(fold(ctx.raw))) ctx.reply.text(this.answers.guarantee);
      ctx.reply.link('Lire la politique de retour', this.urls.returns || this.urls.shipping);
      ctx.reply.action('contact', 'Demander un retour', { question: ctx.raw });
      ctx.reply.chip(CHIP.defect, CHIP.guarantee, CHIP.contact);
    }

    #guarantee(ctx) {
      if (this.answers.guarantee) ctx.reply.text(this.answers.guarantee);
      else if (this.facts.returns) ctx.reply.text(`${this.facts.returns}.`);
      if (this.facts.warranty) ctx.reply.note(`Et dans tous les cas : ${inline(this.facts.warranty)}.`);
      ctx.reply.link('Lire les conditions', this.urls.returns || this.urls.shipping);
      ctx.reply.chip(CHIP.returns, CHIP.defect);
    }

    #defect(ctx) {
      ctx.reply.text('Je suis désolée de ce souci.');
      if (this.answers.damaged) ctx.reply.text(this.answers.damaged);
      else ctx.reply.text('Écrivez-nous avec votre numéro de commande et une photo : notre équipe s’en occupe.');
      if (this.facts.warranty) ctx.reply.note(`${this.facts.warranty}.`);
      ctx.reply.action('contact', "Écrire à l'équipe", { question: ctx.raw });
      const text = fold(ctx.raw);
      const product = this.applicable('battery').find((item) => ctx.named.includes(item)) || (this.product(ctx.state.product) && this.has(this.product(ctx.state.product), 'battery') ? this.product(ctx.state.product) : null);
      if (product && /chauff|allum|charg|vibr|marche|fonctionne/.test(text)) {
        const tips = grep(product, /charg|voyant|appui|pendant la charge/, ['howto', 'precautions']).slice(0, 3);
        if (tips.length) {
          ctx.reply.text('En attendant, vérifiez ces points de la notice :');
          ctx.reply.list(tips);
        }
      }
      ctx.reply.chip(CHIP.returns, CHIP.guarantee);
    }

    #payment(ctx) {
      const types = (this.kb.payments || []).map((type) => PAYMENT_NAMES[type] || type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()));
      const text = fold(ctx.raw);
      if (/plusieurs|3 foi|4 foi|klarna|alma|fraction|etaler/.test(text)) {
        if ((this.kb.payments || []).some((type) => /klarna|alma/.test(type))) {
          ctx.reply.text('Le paiement en plusieurs fois est proposé à l’étape du paiement, selon votre éligibilité.');
        } else {
          ctx.reply.text('Les solutions de paiement disponibles s’affichent à l’étape du paiement, selon votre commande.');
        }
      }
      if (/livraison|contre rembours|espece|cheque|virement/.test(text)) ctx.reply.text('Le paiement se fait en ligne, au moment de la commande.');
      if (types.length) ctx.reply.text(`Vous pouvez payer avec ${join(types)}.`);
      ctx.reply.text('Le paiement est sécurisé : il est traité par nos prestataires de paiement, et VELEA n’a jamais accès à vos données bancaires.');
      ctx.reply.chip(CHIP.cart, CHIP.shipping, CHIP.promo);
    }

    #account(ctx) {
      if (this.kb.accounts) {
        ctx.reply.text('Votre compte vous permet de retrouver vos commandes et leur suivi.');
        ctx.reply.link('Accéder à mon compte', this.urls.account);
      } else {
        ctx.reply.text('Pas besoin de compte : toutes les informations de votre commande vous sont envoyées par e-mail.');
      }
      ctx.reply.chip(CHIP.tracking, CHIP.contact);
    }

    #newsletter(ctx) {
      const text = fold(ctx.raw);
      if (/desinscri|desabonn|plus recevoir|arreter/.test(text)) {
        ctx.reply.text('Chaque e-mail contient un lien de désinscription, en bas du message. Un clic suffit.');
        ctx.reply.chip(CHIP.contact);
        return;
      }
      if (ctx.offer?.percent) {
        ctx.reply.text(`Avec plaisir ! En vous inscrivant, vous recevez votre code de bienvenue −${ctx.offer.percent} %.`);
        ctx.reply.action('offer', `Recevoir mon code −${ctx.offer.percent} %`);
      } else {
        ctx.reply.text('Vous pouvez vous inscrire à notre newsletter en bas de chaque page.');
      }
      ctx.reply.chip(CHIP.catalogue, CHIP.promo);
    }

    #cookies(ctx) {
      ctx.reply.text('Vous choisissez librement les cookies que vous acceptez, et vous pouvez changer d’avis à tout moment.');
      ctx.reply.action('cookies', 'Gérer mes cookies');
      ctx.reply.link('Politique de confidentialité', this.urls.privacy);
      ctx.reply.chip(CHIP.contact);
    }

    #contact(ctx, confirmed = false) {
      const text = fold(ctx.raw);
      if (/telephone|appeler|whatsapp/.test(text)) ctx.reply.text('Notre équipe répond par écrit, pour garder une trace de chaque demande.');
      ctx.reply.text(confirmed ? 'Voici le formulaire :' : 'Bien sûr ! Notre équipe vous répond par e-mail.', 'Si votre message concerne une commande, indiquez son numéro.');
      ctx.reply.action('contact', "Écrire à l'équipe", { question: ctx.state.lastQuestion || '' });
      if (ctx.chat) ctx.reply.action('chat', 'Discuter en direct');
      ctx.reply.chip(CHIP.tracking, CHIP.returns);
    }

    #hours(ctx) {
      ctx.reply.text('Vous pouvez nous écrire à tout moment : notre équipe vous répond par e-mail. Et moi, je suis là jour et nuit.');
      ctx.reply.action('contact', "Écrire à l'équipe", { question: '' });
      ctx.reply.chip(CHIP.catalogue, CHIP.tracking);
    }

    #brand(ctx) {
      const tagline = this.facts.tagline ? `VELEA, c'est ${inline(this.facts.tagline)}.` : 'VELEA, ce sont des essentiels pensés pour vos jours de règles.';
      ctx.reply.text(tagline, 'Nous réunissons quelques essentiels pour vos jours de règles :');
      this.#card(ctx, this.products);
      ctx.reply.link('Découvrir notre approche', this.urls.story);
      ctx.reply.chip(CHIP.recommend, CHIP.shipping);
    }

    #origin(ctx) {
      if (this.answers.origin) ctx.reply.text(this.answers.origin);
      else ctx.reply.text('Pour toute question sur la fabrication d’un produit, notre équipe vous répond par e-mail.');
      const specs = this.products.flatMap((product) => grep(product, /matiere|composition/, ['specs']).map((line) => `${plainTitle(product)} — ${line}`));
      if (specs.length) {
        ctx.reply.text('Les matières, elles, sont détaillées sur chaque fiche :');
        ctx.reply.list(specs.slice(0, 3));
      }
      ctx.reply.action('contact', "Demander à l'équipe", { question: ctx.raw });
      ctx.reply.chip(CHIP.catalogue, CHIP.guarantee);
    }

    #trust(ctx) {
      ctx.reply.text('Je comprends la question, c’est important de commander en confiance.');
      ctx.reply.list([
        'Paiement sécurisé : VELEA n’a jamais accès à vos données bancaires',
        this.answers.returns ? 'Vous avez 14 jours après réception pour changer d’avis' : '',
        this.facts.returns ? inline(this.facts.returns).replace(/^\w/, (c) => c.toUpperCase()) : '',
        this.facts.warranty || '',
        'Notre équipe répond à chaque message, par e-mail',
      ]);
      ctx.reply.link('Lire nos conditions de retour', this.urls.returns || this.urls.shipping);
      ctx.reply.chip(CHIP.payment, CHIP.returns, CHIP.contact);
    }

    #store(ctx) {
      ctx.reply.text('VELEA est une boutique en ligne : tout se commande ici, sur le site, et nos coordonnées figurent dans les mentions légales.', this.facts.shipping ? `${this.facts.shipping}.` : '');
      ctx.reply.chip(CHIP.delay, CHIP.catalogue);
    }

    #social(ctx) {
      ctx.reply.text('Pour suivre nos nouveautés et nos offres, le plus simple est notre newsletter.');
      if (ctx.offer?.percent) ctx.reply.action('offer', `Recevoir mon code −${ctx.offer.percent} %`);
      ctx.reply.chip(CHIP.catalogue, CHIP.promo);
    }

    #faq(ctx) {
      ctx.reply.text('Posez-moi directement votre question : je vous réponds tout de suite. Toutes les questions fréquentes sont aussi réunies sur une page.');
      ctx.reply.link('Questions fréquentes', this.urls.faq);
      ctx.reply.chip(CHIP.shipping, CHIP.returns, CHIP.howto);
    }

    /* ------------------------------------------------------ fallback */

    /**
     * Nothing recognised: look for the message's words in the products'
     * details. Found → those lines. Otherwise the closest subjects and the team.
     * @param {any} ctx
     * @param {any} [only] Search one product only
     */
    #search(ctx, only) {
      const content = ctx.tokens.filter((token) => token.length >= 4 && !STOP.has(token));
      const candidates = [];
      for (const product of only ? [only] : this.products) {
        for (const field of ['highlights', 'specs', 'howto', 'care', 'precautions', 'sizes', 'box']) {
          for (const line of lines(product[field])) candidates.push({ product, line, tokens: words(line) });
        }
        for (const sentence of String(product.description || '').split(/(?<=[.!?])\s+/)) if (sentence.trim()) candidates.push({ product, line: sentence.trim(), tokens: words(sentence) });
      }
      const productWords = new Set(this.names.flatMap(({ terms }) => terms.flatMap((parts) => parts.map((part) => part.text))));
      let best = [];
      let bestScore = 0;
      for (const candidate of candidates) {
        let score = 0;
        for (const token of content) {
          if (productWords.has(token)) continue;
          if (candidate.tokens.some((word) => same(word, { text: token, prefix: false }) || (token.length >= 6 && word.startsWith(token.slice(0, 6))))) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          best = [candidate];
        } else if (score === bestScore && score > 0) best.push(candidate);
      }
      if (bestScore >= 1 && best.length <= 6) {
        const product = best[0].product;
        ctx.state.product = product.handle;
        ctx.reply.text(`Voici ce que je peux vous dire sur ${the(product)} :`);
        ctx.reply.list(best.slice(0, 3).map((candidate) => candidate.line));
        ctx.reply.link('Voir la fiche complète', product.url);
        ctx.reply.chip(CHIP.howto, CHIP.price, CHIP.contact);
        return true;
      }
      if (only) {
        ctx.reply.text(`Ce point précis ne figure pas sur la fiche ${this.#of(only)}. Voici l’essentiel :`);
        ctx.reply.list(lines(only.highlights).slice(0, 4));
        ctx.reply.text('Pour cette question précise, notre équipe vous répond : votre question est déjà écrite.');
        ctx.reply.action('contact', "Demander à l'équipe", { question: ctx.raw });
        ctx.unsure = true;
        return true;
      }
      return false;
    }

    #fallback(ctx) {
      if (this.#search(ctx)) return;
      ctx.unsure = true;
      const near = ctx.ranked.filter((entry) => CHIP[entry.id]).slice(0, 3).map((entry) => CHIP[entry.id]);
      const options = [
        'Je veux être sûre de bien vous répondre : pouvez-vous me le dire autrement, en quelques mots ?',
        'Pour vous donner la bonne information, pouvez-vous préciser votre question ?',
      ];
      ctx.reply.text(options[ctx.state.turns % options.length]);
      ctx.reply.text('Je peux vous renseigner sur nos produits, la livraison, le suivi, le paiement et les retours. Notre équipe peut aussi vous répondre personnellement : votre question est déjà écrite.');
      ctx.reply.action('contact', "Demander à l'équipe", { question: ctx.raw });
      ctx.reply.chip(...near, CHIP.catalogue, CHIP.shipping, CHIP.returns);
    }
  }

  window.VeleaBrain = {
    /** @param {any} kb */
    create: (kb) => new Brain(kb),
    /** For checks: how a message is read. */
    read: (text) => analyse(words(text)).ranked,
  };
})();
