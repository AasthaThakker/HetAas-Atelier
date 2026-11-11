// Resi: HetAas's AI shop assistant (scoped chat + gift finder). Lives only inside the chat panel.
// Talks to the Worker (/api/chat). Shows nothing when window.HETAAS_API is empty.
(function () {
    var api = window.HETAAS_API;
    if (!api) return;

    var history = []; // { role: 'user' | 'assistant', content: string }

    var CHIPS = [
        { label: '🎁 Gift ideas under ₹300', text: 'Gift ideas under ₹300' },
        { label: '🎁 Gift for my mom', text: 'I need a gift for my mom, what do you suggest?' },
        { label: '📦 Is it available?', text: 'Which pieces are available right now and how long do they take?' },
        { label: '✨ Custom name piece', text: 'Can I get a custom piece with my name?' },
        { label: '💳 Payment & delivery', text: 'How do payment and delivery work?' }
    ];

    // ---- Build UI ----
    var launcher = el('button', 'chat-launcher', { type: 'button', 'aria-label': 'Ask Resi, the AI shop assistant' }, [
        el('span', 'chat-launcher-icon', null, '✨'),
        el('span', 'chat-launcher-label', null, 'Ask Resi'),
        el('span', 'chat-ai-tag', null, 'AI')
    ]);
    var panel = el('div', 'chat-panel', { role: 'dialog', 'aria-label': 'Resi, AI shop assistant' });
    var header = el('div', 'chat-header', null, [
        el('div', null, null, [
            el('span', 'chat-title', null, 'Resi ✨'),
            el('span', 'chat-subtitle', null, 'AI shop assistant · for the artist, tap "DM the Artist"')
        ]),
        el('button', 'chat-close', { type: 'button', 'aria-label': 'Close chat' }, '✕')
    ]);
    var log = el('div', 'chat-log', { 'aria-live': 'polite' });
    var chips = el('div', 'chat-chips');
    var form = el('form', 'chat-form');
    var input = el('input', 'chat-input', { type: 'text', placeholder: 'Ask about pieces, gifts, orders…', maxlength: '400', autocomplete: 'off' });
    var sendBtn = el('button', 'chat-send', { type: 'submit' }, 'Send');
    form.appendChild(input);
    form.appendChild(sendBtn);
    panel.appendChild(header);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(form);
    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    CHIPS.forEach(function (c) {
        var b = el('button', 'chat-chip', { type: 'button' }, c.label);
        b.addEventListener('click', function () { send(c.text); });
        chips.appendChild(b);
    });

    launcher.addEventListener('click', function () {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            if (!log.childElementCount) addBot("Hi, I'm Resi ✨ HetAas's AI assistant. I can find a gift, check availability, plan a custom piece or explain payment. What are you looking for?");
            input.focus();
        }
    });
    header.querySelector('.chat-close').addEventListener('click', function () { panel.classList.remove('open'); });
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        send(input.value);
    });

    // ---- Chat logic ----
    function send(raw) {
        var text = String(raw || '').trim();
        if (!text || sendBtn.disabled) return;
        input.value = '';
        addUser(text);
        history.push({ role: 'user', content: text });
        var typing = addBot('Resi is thinking…');
        typing.classList.add('typing');
        setBusy(true);

        // Never leave the visitor waiting: say so after a few seconds, give up after 20.
        var slowTimer = setTimeout(function () { typing.textContent = 'Still thinking, one moment…'; }, 5000);
        var ctrl = new AbortController();
        var giveUp = setTimeout(function () { ctrl.abort(); }, 20000);

        fetch(api + '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history.slice(-8) }),
            signal: ctrl.signal
        })
            .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
            .then(function (res) {
                typing.remove();
                if (!res.ok) throw new Error(res.d.error || 'Something went wrong.');
                var reply = res.d.reply || '';
                history.push({ role: 'assistant', content: reply });
                addBot(reply, res.d.products || []);
            })
            .catch(function (err) {
                typing.remove();
                var msg = err && err.name === 'AbortError' ? 'Sorry, that took too long.' : err.message;
                history.pop(); // let them retry the same question cleanly
                addBot(msg + ' Please try again, or tap "DM the Artist" to message us on Instagram.');
            })
            .then(function () {
                clearTimeout(slowTimer);
                clearTimeout(giveUp);
                setBusy(false);
            });
    }

    function setBusy(busy) {
        sendBtn.disabled = busy;
        input.disabled = busy;
    }

    function addUser(text) {
        log.appendChild(el('div', 'chat-msg user', null, text));
        scrollDown();
    }

    function addBot(text, products) {
        var wrap = el('div', 'chat-msg bot', null, text);
        if (products && products.length) {
            var grid = el('div', 'chat-products');
            products.forEach(function (p) {
                var card = el('div', 'chat-product');
                var img = el('img', null, { src: p.image, alt: p.name, loading: 'lazy' });
                var meta = el('div', 'chat-product-meta', null, [
                    el('div', 'chat-product-name', null, p.name),
                    el('div', 'chat-product-price', null, '₹' + p.price + (p.available ? '' : ' · unavailable'))
                ]);
                card.appendChild(img);
                card.appendChild(meta);
                if (p.available) {
                    var add = el('button', 'chat-add', { type: 'button' }, 'Add to basket');
                    add.addEventListener('click', function () {
                        if (typeof window.addToCartById === 'function') {
                            window.addToCartById(p.id, 1);
                            add.textContent = 'Added ✓';
                            add.disabled = true;
                        }
                    });
                    card.appendChild(add);
                }
                grid.appendChild(card);
            });
            wrap.appendChild(grid);
        }
        log.appendChild(wrap);
        scrollDown();
        return wrap;
    }

    function scrollDown() { log.scrollTop = log.scrollHeight; }

    // Tiny DOM helper. Text is set with textContent, never innerHTML, so replies cannot inject markup.
    function el(tag, cls, attrs, content) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
        if (content !== undefined && content !== null) {
            if (Array.isArray(content)) content.forEach(function (c) { node.appendChild(c); });
            else node.textContent = content;
        }
        return node;
    }
})();
