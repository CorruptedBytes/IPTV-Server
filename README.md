# IPTV-Server using HLS-Protocol

This is an IPTV-Server that I coded in NodeJS using the HLS-Protocol.

<br />

---

## Installation

### Clone the repository

```bash
git clone https://github.com/CorruptedBytes/IPTV-Server
```

### Install Dependency Packages

```bash
npm install
```

### Create MySQL Table

```sql
CREATE TABLE `keys` (`key` varchar(255) NOT NULL);
```


---

## Configuration

Please configure the settings in the `.env` file

<br />

---

## Run the server

Normal Mode
```bash
npm run start
```


Developer Mode
```bash
npm run dev
```

<br />

---

## Use

### Master Playlist: `http://127.0.0.1:3360/iptv/<KEY>/playlist.m3u8`
### Channels: `http://127.0.0.1:3360/iptv/<KEY>/<ChannelID>/index.m3u8`

If the Key is invalid instead of the channel the server will respond with a 403 Channel which says that the Key is invalid.

If the Channel does not exisit then the server will respond with a 404 Channel which says that the Channel can't be found.


Do **NOT** delete the segments folder manually in the channels folders.

<br />

---

## Create a Channel

The Channel `100` is a example channel.

You can create your own channel by creating a new folder in the `/iptv` directory.<br />The Name of the folder is your Channel ID and it's recommended to use only numbers for that. Then you have to create a `channel.json` file in the folder with this JSON content:

```json
{
	"name": "Example Channel",
	"group": "Test",
	"requireKey": true,
	"listed": true,
	"inputType": "OTHER",
	"input": "rtp://127.0.0.1:1234"
}
```

### Input Types: `FILE, DEVICE, OTHER, STATIC`
### Channel Icon: `icon.png - Should be 48x48px`

<br />

---

## API

### Usage `http://127.0.0.1/api/<API_KEY>/<PARAMETERS>`
<br />

### **Parameters:**
### Reload Server: `reload`
### Restart Server: `restart`
### Show all keys: `key`
### Show all Channels: `channel?action=list`
### Create Channel: `channel?action=add&id=<CHANNEL_ID>&name=<CHANNEL_NAME>&group=<CHANNEL_GROUP>`
### CleanUp Channel: `channel?action=cleanup` | `channel?action=cleanup&id=<CHANNEL_ID>`