FROM nginx:alpine

# Copia os arquivos do frontend para a pasta pública do Nginx
COPY frontend/ /usr/share/nginx/html/

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]

#buildar imagem = docker build -t nome-projeto:1.0 // (1.0 é versão) + caminho da Dockerfile(NO CASO AKI ESTAVA NA RAIZ)
#docker run -d -p 8080:80 nome-imagem:1.0 // -d pra nao gerar log -p porta 8080porta do meu PC  80 porta que foi exposta