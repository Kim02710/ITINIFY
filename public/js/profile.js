document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }

    const usernameEl = document.querySelector('.username');
    const avatarCircleEl = document.getElementById('avatarCircle');
    const profileForm = document.getElementById('profileForm');
    const imageUpload = document.getElementById('imageUpload');
    const avatarUpload = document.querySelector('.avatar-upload');

    let userId = null;

    fetch('/api/user/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(user => {
        userId = user.id;
        usernameEl.textContent = user.username.toUpperCase();
        profileForm.username.value = user.username;
        profileForm.email.value = user.email;
        if (user.profile_image) {
            avatarCircleEl.innerHTML = `<img src="/uploads/${user.profile_image}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }
    });

    avatarUpload.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarCircleEl.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('username', profileForm.username.value);
        formData.append('email', profileForm.email.value);
        if (profileForm.password.value) {
            formData.append('password', profileForm.password.value);
        }
        if (imageUpload.files[0]) {
            formData.append('imgupld', imageUpload.files[0]);
        }

        const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            alert('Profile updated successfully!');
            window.location.reload();
        } else {
            alert(data.message);
        }
    });

    document.getElementById('backButton').addEventListener('click', () => {
        window.history.back();
    });
});
