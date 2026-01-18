# Step 1: Build stage menggunakan versi Go terbaru
FROM golang:1.25.5-alpine AS builder

# Pasang git dan build-base jika ada dependency yang membutuhkannya
RUN apk add --no-cache git build-base

WORKDIR /app

# Copy dependency files terlebih dahulu agar build lebih cepat (caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy seluruh source code
COPY . .

# Build aplikasi dari folder ./apps ke file executable bernama 'main'
RUN go build -o main ./apps

# Step 2: Runtime stage menggunakan Image yang sangat ringan
FROM alpine:latest
RUN apk add --no-cache ca-certificates

WORKDIR /root/

# Salin file executable dari stage builder
COPY --from=builder /app/main .

# PENTING: Salin folder views dan public agar UI tampil
# Jika folder views/public Anda berada di root, gunakan perintah ini:
COPY --from=builder /app/views ./views
COPY --from=builder /app/public ./public

# Gunakan port 3000 (standard Fiber)
EXPOSE 3000

# Jalankan aplikasi
CMD ["./main"]