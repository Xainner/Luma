export const es = {
  /* App */
  'app.errorConnection': 'Error de conexión',

  /* Login */
  'login.title': 'Tu IA, sin cadenas. Inicia sesión para continuar.',
  'login.email': 'Email',
  'login.password': 'Contraseña',
  'login.emailPlaceholder': 'tucorreo@luma.local',
  'login.submit': 'Iniciar sesión',
  'login.loading': 'Entrando…',

  /* Onboarding */
  'onboarding.tagline': 'Chat libre con tu LLM local',
  'onboarding.hero': 'Tu IA, sin',
  'onboarding.heroHighlight': 'cadenas.',
  'onboarding.heroDesc':
    'Conéctate a cualquier servidor OpenAI-compatible, descubre sus modelos al vuelo y chatea con streaming, imágenes y total privacidad.',
  'onboarding.featureStreaming': 'Streaming en tiempo real',
  'onboarding.featureStreamingDesc': 'Respuestas token a token con animación',
  'onboarding.featureImages': 'Adjunta imágenes',
  'onboarding.featureImagesDesc': 'Arrastra, pega o sube capturas y fotos',
  'onboarding.featureSettings': 'Todo configurable',
  'onboarding.featureSettingsDesc': 'Modelo, temperatura, prompt y más en Ajustes',
  'onboarding.connect': 'Conecta tu servidor',
  'onboarding.subtitle':
    'Configura la URL base compatible con OpenAI y descubre los modelos disponibles.',
  'onboarding.urlLabel': 'URL base',
  'onboarding.urlPlaceholder': 'http://host:puerto/v1',
  'onboarding.discover': 'Descubrir modelos',
  'onboarding.discovering': 'Descubriendo…',
  'onboarding.found': 'Modelos encontrados: {count}',
  'onboarding.noModels': 'No se encontraron modelos en esa URL.',
  'onboarding.start': 'Comenzar a chatear',
  'onboarding.starting': 'Conectando…',
  'onboarding.language': 'Idioma',
  'onboarding.waitingTitle': 'Esperando configuración',
  'onboarding.waitingDesc':
    'El administrador aún no ha configurado el servidor. Pídele que complete la configuración en su panel de administración.',

  /* Sidebar */
  'sidebar.newChat': 'Nueva conversación',
  'sidebar.chats': 'Conversaciones',
  'sidebar.noChats': 'Aún no hay conversaciones.\nEmpieza una abajo.',
  'sidebar.profile': 'Perfil',
  'sidebar.noProfile': 'Sin perfil',
  'sidebar.model': 'Modelo activo',
  'sidebar.noModels': 'Descubre modelos en Ajustes',
  'sidebar.settings': 'Ajustes',
  'sidebar.admin': 'Administrador',
  'sidebar.user': 'Usuario',
  'sidebar.logout': 'Cerrar sesión',
  'sidebar.closeMenu': 'Cerrar menú',
  'sidebar.deleteChat': 'Eliminar {title}',

  /* Chat */
  'chat.openMenu': 'Abrir menú',
  'chat.new': 'Nuevo',
  'chat.title': 'Nueva conversación',
  'chat.emptyTitle': '¿En qué te ayudo hoy?',
  'chat.emptyDesc':
    'Sin censura, sin límites. Pregunta lo que quieras, adjunta imágenes y deja que Luma responda en streaming.',
  'chat.suggestion1': 'Explícame cómo funciona un transformer en una frase sencilla',
  'chat.suggestion2': 'Escríbeme un poema corto sobre la tecnología y el silencio',
  'chat.suggestion3': 'Dame 10 ideas creativas para un proyecto personal',
  'chat.suggestion4': 'Ayúdame a depurar un fragmento de código',

  /* Composer */
  'composer.placeholder': 'Escribe un mensaje…',
  'composer.placeholderStreaming': 'Generando respuesta…',
  'composer.message': 'Mensaje',
  'composer.dropImages': 'Suelta las imágenes aquí',
  'composer.attach': 'Adjuntar imágenes',
  'composer.removeImage': 'Quitar {name}',
  'composer.send': 'Enviar mensaje',
  'composer.stop': 'Detener generación',
  'composer.hint': 'Enter para enviar · Shift+Enter para nueva línea · arrastra o pega imágenes',

  /* Mensajes */
  'bubble.copy': 'Copiar respuesta',

  /* Markdown */
  'markdown.copy': 'Copiar',
  'markdown.copied': 'Copiado',

  /* Ajustes */
  'settings.back': 'Volver al chat',
  'settings.title': 'Ajustes',
  'settings.readOnlyNote':
    'La configuración está en modo global: la gestiona el administrador. Tú solo puedes usar los chats.',
  'settings.userModeNote':
    'Modo por usuario: tus ajustes son privados y solo afectan a tu cuenta.',
  'settings.globalConfig': 'Configuración global',
  'settings.connectionTitle': 'Conexión y modelo',
  'settings.urlLabel': 'URL base',
  'settings.discover': 'Descubrir',
  'settings.discovering': 'Buscando…',
  'settings.noModels': 'Sin modelos descubiertos',
  'settings.model': 'Modelo activo',
  'settings.profile': 'Perfil activo',
  'settings.noProfile': 'Sin perfil',
  'settings.temperature': 'Temperatura',
  'settings.precise': 'Preciso',
  'settings.creative': 'Creativo',
  'settings.maxTokens': 'Máximo de tokens',
  'settings.language': 'Idioma',
  'settings.systemPrompt': 'System prompt',
  'settings.systemPromptAdminDesc':
    'Se aplica a todas las conversaciones, además del master prompt del perfil activo.',
  'settings.systemPromptUserDesc':
    'Solo el administrador puede modificarlo. Se aplica a todas las conversaciones.',
  'settings.profiles': 'Perfiles',
  'settings.profilesDesc':
    'El master prompt del perfil activo se añade al system prompt en cada conversación.',
  'settings.profilesDescNonAdmin': ' Solo el administrador puede crear o editar perfiles.',
  'settings.noProfiles': 'No hay perfiles.',
  'settings.noMaster': 'Sin master prompt',
  'settings.active': 'Activo',
  'settings.danger': 'Zona de peligro',
  'settings.dangerDesc': 'Elimina permanentemente tus conversaciones guardadas.',
  'settings.confirmWipe': 'Confirmar borrado',
  'settings.wipeChats': 'Borrar mis chats',
  'settings.save': 'Guardar cambios',
  'settings.saved': 'Guardado',
  'settings.badgeAdmin': 'admin',
  'settings.badgeUser': 'usuario',

  /* Admin */
  'admin.scope': 'Alcance de la configuración',
  'admin.scopeDesc':
    'Global: todos usan la misma configuración (la gestionas tú). Por usuario: cada usuario configura su propia URL, key y modelo. El system prompt y los perfiles siempre son globales.',
  'admin.global': 'Global',
  'admin.perUser': 'Por usuario',
  'admin.systemPrompt': 'System prompt global',
  'admin.systemPromptDesc':
    'Solo el administrador puede modificarlo. Se aplica a todas las conversaciones, además del master prompt del perfil activo.',
  'admin.savePrompt': 'Guardar system prompt',
  'admin.saved': 'Guardado',
  'admin.users': 'Usuarios',
  'admin.newEmail': 'nuevo@correo.com',
  'admin.newPass': 'Contraseña',
  'admin.roleUser': 'Usuario',
  'admin.roleAdmin': 'Admin',
  'admin.create': 'Crear',
  'admin.loadingUsers': 'Cargando usuarios…',
  'admin.changeRole': 'Cambiar rol de {email}',
  'admin.resetPass': 'Cambiar contraseña de {email}',
  'admin.newPassword': 'Nueva contraseña',
  'admin.ok': 'OK',
  'admin.cancel': 'Cancelar',
  'admin.delete': 'Eliminar {email}',
  'admin.confirm': '¿Confirmar?',

  /* Perfiles */
  'profiles.new': 'Nuevo perfil',
  'profiles.empty':
    'Aún no hay perfiles. Crea uno para añadir un master prompt adicional al system prompt.',
  'profiles.name': 'Nombre del perfil',
  'profiles.emoji': 'Emoji del perfil',
  'profiles.color': 'Color del perfil',
  'profiles.master': 'Master prompt',
  'profiles.masterHint': '(se añade tras el system prompt)',
  'profiles.masterPlaceholder':
    'Directivas adicionales que aplican a todas las conversaciones con este perfil…',
  'profiles.active': 'Activo',
  'profiles.use': 'Usar',
  'profiles.save': 'Guardar',
  'profiles.saved': 'Guardado',
  'profiles.delete': 'Eliminar',
  'profiles.confirm': '¿Confirmar?',
  'profiles.unnamed': 'Sin nombre',

  /* API key */
  'apikey.label': 'API key',
  'apikey.optional': '(opcional)',
  'apikey.placeholder': 'sk-…',
  'apikey.show': 'Mostrar API key',
  'apikey.hide': 'Ocultar API key',
} as const

export type I18nKey = keyof typeof es
