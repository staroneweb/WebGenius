# MongoDB Atlas Connection Setup Guide

## Common SSL/TLS Connection Issues

If you're getting SSL/TLS errors when connecting to MongoDB Atlas, check the following:

### 1. Connection String Format

Your `.env` file should have the connection string in this format:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Important:**
- Replace `username` with your Atlas database user
- Replace `password` with your Atlas database password (URL-encoded if it contains special characters)
- Replace `cluster` with your actual cluster name
- Replace `database` with your database name (e.g., `webgenius`)

### 2. IP Whitelist in Atlas

1. Go to MongoDB Atlas Dashboard
2. Click on "Network Access" in the left sidebar
3. Click "Add IP Address"
4. For development, add `0.0.0.0/0` (allows all IPs) - **NOT RECOMMENDED FOR PRODUCTION**
5. For production, add your server's specific IP address

### 3. Database User Permissions

1. Go to "Database Access" in Atlas
2. Make sure your database user has "Read and write to any database" permissions
3. Or at minimum, access to your specific database

### 4. Connection String from Atlas

The easiest way to get the correct connection string:

1. Go to your Atlas cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Select "Node.js" and version "5.5 or later"
5. Copy the connection string
6. Replace `<password>` with your actual password
7. Replace `<dbname>` with your database name (e.g., `webgenius`)

### 5. URL Encoding Special Characters

If your password contains special characters, URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- etc.

### 6. Example Connection Strings

**Correct format:**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/webgenius?retryWrites=true&w=majority
```

**With special characters in password:**
```
mongodb+srv://myuser:my%40password@cluster0.abc123.mongodb.net/webgenius?retryWrites=true&w=majority
```

### 7. Troubleshooting SSL Errors

If you still get SSL errors:

1. **Check your connection string** - Make sure it starts with `mongodb+srv://`
2. **Verify IP whitelist** - Your IP must be whitelisted
3. **Check database user** - User must exist and have correct permissions
4. **Test connection** - Try connecting with MongoDB Compass or mongo shell first
5. **Check network** - Make sure you're not behind a firewall blocking MongoDB ports

### 8. Alternative: Use Standard Connection String

If `mongodb+srv://` doesn't work, you can use the standard connection string:

```
mongodb://username:password@cluster0-shard-00-00.abc123.mongodb.net:27017,cluster0-shard-00-01.abc123.mongodb.net:27017,cluster0-shard-00-02.abc123.mongodb.net:27017/webgenius?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

But `mongodb+srv://` is recommended as it's simpler and automatically handles SSL.

### 9. Verify Connection

Test your connection string with this Node.js script:

```javascript
const { MongoClient } = require('mongodb');

const uri = "your-connection-string-here";
const client = new MongoClient(uri);

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas!");
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Ping successful!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await client.close();
  }
}

testConnection();
```

## Quick Checklist

- [ ] Connection string starts with `mongodb+srv://`
- [ ] Username and password are correct
- [ ] Password is URL-encoded if it has special characters
- [ ] Database name is correct
- [ ] IP address is whitelisted in Atlas (0.0.0.0/0 for development)
- [ ] Database user has proper permissions
- [ ] Connection string is in `.env` file (not committed to git)

