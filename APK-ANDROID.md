# APK Android do AYRES

Este projeto está preparado para gerar um APK Android usando Capacitor.

## Como gerar o APK pelo GitHub

1. Entre no repositório no GitHub.
2. Vá na aba **Actions**.
3. Clique em **Build Android APK**.
4. Clique em **Run workflow**.
5. Aguarde terminar.
6. Abra a execução finalizada.
7. Baixe o arquivo em **Artifacts** com o nome:

```txt
AYRES-android-debug-apk
```

Dentro do ZIP estará o APK:

```txt
app-debug.apk
```

## Como instalar no celular

1. Envie o APK para o celular.
2. Toque no arquivo `app-debug.apk`.
3. O Android pode pedir para permitir instalação de fontes desconhecidas.
4. Permita e instale.

## Observação

Esse APK é uma versão **debug**, boa para teste interno.

Para publicar na Play Store ou distribuir profissionalmente, precisa gerar um APK/AAB assinado com chave de produção.
