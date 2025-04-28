document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = getCookie('token');
    const [auth] = urlParams.keys();
    document.getElementById('another').addEventListener('click', () => {
        document.getElementById('shorten').classList.remove('hidden');
        document.getElementById('result').classList.remove('flex');
        document.getElementById('result').classList.add('hidden');
    });
    document.getElementById('shorten').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url').value || '';
        const slugs = (document.getElementById('slugs').value || '')
            .split(',')
            .map((slug) => slug.trim())
            .filter((slug) => slug.length > 0);
        const password = document.getElementById('password').value || '';
        const expires = document.getElementById('expiry').value || '';
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: sessionToken || auth,
            },
            body: JSON.stringify({ url, slugs, password, expires }),
        });
        const data = await response.json();
        if (response.status === 200) {
            document.getElementById('url').value = '';
            document.getElementById('slugs').value = '';
            document.getElementById('password').value = '';
            document.getElementById('expiry').value = '';
            document.getElementById('shorten').classList.add('hidden');
            document.getElementById('result').classList.remove('hidden');
            document.getElementById('result').classList.add('flex');
            const linksList = document.getElementById('links-list');
            const expiryEl = document.getElementById('expiry-message');
            linksList.innerHTML = '';
            data.link.shortened.forEach((link) => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${link}" class="copy underline transition-colors hover:text-gray-400">${link}</a>`;
                li.addEventListener('click', (e) => {
                    e.preventDefault();
                    copy(e.target.href);
                    alert('Copied to clipboard!');
                });
                linksList.appendChild(li);
            });
            if (data.link.expiry) {
                expiryEl.classList.remove('hidden');
                expiryEl.innerHTML = `Expiry: <code class="rounded-md bg-gray-900 px-1">${new Date(data.link.expiry).toLocaleString()}</code>`;
            } else {
                expiryEl.classList.add('hidden');
                document.getElementById('expiry-message').innerHTML = '';
            }
        } else {
            if (data.errors?.length) alert(data.errors.join('\n'));
            else if (data.error) alert(data.error);
            else {
                alert('An unexpected error occurred. Check the console for details.');
                console.error(data);
            }
        }
    });
});

function copy(text) {
    navigator.clipboard.writeText(text);
}

function getCookie(name) {
    const match = document.cookie.split('; ').find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}
