import { api, type User } from "./api.js";
export function renderAccount(
  container: HTMLElement,
  start: (user: User) => Promise<void>,
) {
  container.innerHTML = `<main class="welcome"><section class="intro"><div class="eyebrow">UN HOGAR, INCLUSO AL FINAL DEL MUNDO</div><h1>ASTRA<span>Nuestro refugio.</span></h1><p>Una pequeña granja. Dos supervivientes.<br>Y muchas razones para cuidarla juntos.</p><div class="features"><span>✦ Cultiven</span><span>⌂ Construyan</span><span>☾ Sobrevivan</span></div><div class="welcome-art"><div class="sun"></div><div class="hills"></div><div class="tiny-house"><i></i></div><div class="field-lines"></div></div></section><section class="login-card"><span class="eyebrow">LA VIDA VUELVE A CRECER</span><h2>Bienvenido a casa</h2><p id="account-description">Entra con tu personaje o crea uno nuevo.</p><form id="login-form"><label>Nombre de jugador<input id="username" name="username" autocomplete="username" minlength="2" maxlength="24" required placeholder="Tu nombre"></label><label>Contraseña<input id="password" name="password" type="password" autocomplete="current-password" minlength="10" maxlength="128" required placeholder="Al menos 10 caracteres"></label><button class="primary" type="submit">Entrar al refugio <span>→</span></button><button id="register" class="secondary" type="button">Crear mi personaje</button></form><div id="world-choice" hidden><p>Tu hogar es privado. Comparte una invitación con tu pareja.</p><button id="create-world" class="primary">Crear nuestra granja</button><label>Invitación de tu pareja<input id="invite-code" autocomplete="off" placeholder="Pega aquí el código"></label><button id="join-world" class="secondary">Unirme a su granja</button><button id="switch-account" class="quiet">Cambiar de cuenta</button></div><p id="account-error" role="alert"></p><small>La granja descansa cuando ambos salen.<br>Sin cuenta de correo. Conserva tu contraseña.</small></section></main>`;
  const error = container.querySelector<HTMLElement>("#account-error")!;
  const form = container.querySelector<HTMLFormElement>("#login-form")!;
  let busy = false;
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    busy = true;
    error.textContent = "";
    container
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((b) => (b.disabled = true));
    try {
      await fn();
    } catch (e) {
      error.textContent = (e as Error).message;
    } finally {
      busy = false;
      container
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((b) => (b.disabled = false));
    }
  };
  const finish = async () => {
    const user = await api<User>("me");
    if (user.worldId) {
      await start(user);
    } else {
      form.hidden = true;
      container.querySelector<HTMLElement>("#world-choice")!.hidden = false;
    }
  };
  const credentials = () => ({
    username: container
      .querySelector<HTMLInputElement>("#username")!
      .value.trim(),
    password: container.querySelector<HTMLInputElement>("#password")!.value,
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    void run(async () => {
      await api("login", credentials());
      await finish();
    });
  };
  container.querySelector<HTMLButtonElement>("#register")!.onclick = () => {
    if (!form.reportValidity()) return;
    void run(async () => {
      await api("register", credentials());
      await finish();
    });
  };
  container.querySelector<HTMLButtonElement>("#create-world")!.onclick = () =>
    void run(async () => {
      await api("worlds", {});
      await finish();
    });
  container.querySelector<HTMLButtonElement>("#join-world")!.onclick = () =>
    void run(async () => {
      await api("invites/redeem", {
        token: container
          .querySelector<HTMLInputElement>("#invite-code")!
          .value.trim(),
      });
      await finish();
    });
  container.querySelector<HTMLButtonElement>("#switch-account")!.onclick = () =>
    void run(async () => {
      await api("logout", {});
      form.hidden = false;
      container.querySelector<HTMLElement>("#world-choice")!.hidden = true;
    });
  void api<User>("me")
    .then(async (user) => {
      if (user.worldId) await start(user);
      else {
        form.hidden = true;
        container.querySelector<HTMLElement>("#world-choice")!.hidden = false;
      }
    })
    .catch(() => {});
}
