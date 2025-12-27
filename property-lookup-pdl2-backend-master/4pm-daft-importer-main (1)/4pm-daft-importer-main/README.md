# 🏡 Daft Importer

**A Spring Boot app to fetch and expose Daft.ie real estate listings via REST** 🚀

---

## ✨ Features

- 🔌 **Connects to the Daft SOAP API** using JAX-WS  
- 📦 **Automatic import** of properties by type (sale, rent, commercial…)  
- 🔍 **REST API** to query properties by ID, type or price range  
- 🧭 **OpenAPI documentation** included (Swagger UI)

---

## 🧭 Project Structure

📁 `src/main/java/com/fourpm/daft_importer/` – Main source code  
🧾 `src/main/resources/wsdl.xml` – Daft SOAP WSDL definition  
🔧 `src/main/resources/binding.xjb` – JAXB binding config  
🧪 `src/test/java/` – Unit tests  
📦 `pom.xml` – Maven config & WSDL code generation setup

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/daft/properties?apiKey=...` | List all properties |
| `GET` | `/api/daft/properties/{id}?apiKey=...` | Get property by ID |
| `GET` | `/api/daft/properties/type?type=TYPE&apiKey=...` | Filter by type |
| `GET` | `/api/daft/properties/price-range?minPrice=MIN&maxPrice=MAX&apiKey=...` | Filter by price range |

> 🔐 All endpoints require a valid `apiKey`

---

## 🛠️ Requirements

- ☕ Java **17+**
- 🐘 Maven **3.9+**
- 🌐 Internet access (to fetch the WSDL)

---

