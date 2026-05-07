# Spectacle Tag for Google Tag Manager Server-Side

This is a **Google Tag Manager Server-Side (s-GTM)** Template for **Spectacle tracking**. It allows you to send data directly from your server container to the Spectacle API, providing enhanced control over data and cookie management, and reducing reliance on client-side scripts.

## 🚀 Features

- **Server-Side Tracking:** Sends `page`, `identify`, `track`, and `group` calls directly from the GTM Server Container.
- **Cookie Management:** Automatically manages the Spectacle **Anonymous ID** (`sp__anon_id`) and **User ID** (`sp__user_id`) cookies for cross-event and cross-request user stitching.
- **Full Context Inclusion:** Automatically extracts and includes user context like **User-Agent**, **Page/Referrer URL**, **Campaign UTMs**, **Timezone**, and **Locale** from the incoming request data.
- **Consent Mode Support:** Includes a built-in check for `ad_storage` consent, allowing you to control tag firing based on the user's consent status.
- **Flexible Logging:** Supports logging to the GTM Console for **Debugging/Preview** mode and offers **optional BigQuery logging** for storing full request/response data.
- **Flexible Configuration:** Allows passing custom `User Traits`, `Group Traits`, and `Event Properties` via a simple table input in the tag configuration.

---

## ⚙️ Installation (Import .tpl)

1.  **Download the Template:**
    - Download the `template.tpl` file from this repository.
2.  **Import to GTM Server Container:**
    - In your GTM Server Container, navigate to the **Templates** section.
    - Click **New** under the **Tag Templates** section.
    - Click the **three-dot menu** in the top right and select **Import**.
    - Select the downloaded `template.tpl` file and click **Save**.
3.  **Create a New Tag:**
    - Go to **Tags** and click **New**.
    - Select the newly imported **"Spectacle by Stape"** tag.

---

## 🛠️ Tag Configuration

When setting up the tag, you will configure it for a specific Spectacle method type (`page`, `identify`, `track`, or `group`).

### 1. Base Configuration

| Parameter                  | Type   | Required | Description                                                                  |
| :------------------------- | :----- | :------- | :--------------------------------------------------------------------------- |
| **Spectacle Workspace ID** | Text   | **Yes**  | Your unique workspace ID (must start with `ws_`).                            |
| **Method Type**            | Select | **Yes**  | The type of Spectacle call to make: `page`, `identify`, `track`, or `group`. |

### 2. Method-Specific Fields

Based on the **Method Type** selected, additional fields will be enabled:

#### **`Identify` Fields**

| Parameter                        | Type         | Description                                                             |
| :------------------------------- | :----------- | :---------------------------------------------------------------------- |
| **User ID**                      | Text         | The unique ID for the user. If provided, it will be stored as a cookie. |
| **Email, First Name, Last Name** | Text         | Standard user attributes.                                               |
| **Additional User Traits**       | Simple Table | Custom user attributes to send in the `traits` object.                  |

#### **`Track` Fields**

| Parameter              | Type         | Required                                        | Description                                                   |
| :--------------------- | :----------- | :---------------------------------------------- | :------------------------------------------------------------ |
| **Event Name**         | Text         | **Yes**                                         | The name of the event being tracked (e.g., `Product Viewed`). |
| **Revenue (in cents)** | Text         | Optional                                        | Revenue value associated with the event.                      |
| **Currency**           | Text         | Optional                                        | Currency code (e.g., `USD`).                                  |
| **Event Properties**   | Simple Table | Custom data to send in the `properties` object. |

#### **`Group` Fields**

| Parameter        | Type         | Required                                                | Description                          |
| :--------------- | :----------- | :------------------------------------------------------ | :----------------------------------- |
| **Group ID**     | Text         | **Yes**                                                 | The unique ID for the company/group. |
| **Group Traits** | Simple Table | Custom group attributes to send in the `traits` object. |

### 3. Advanced Configuration

| Parameter         | Type | Default                     | Description                                                                                            |
| :---------------- | :--- | :-------------------------- | :----------------------------------------------------------------------------------------------------- |
| **API Base URL**  | Text | `https://t.spectaclehq.com` | The Spectacle API endpoint. Must use HTTPS                                                             |
| **Cookie Domain** | Text | Empty (auto)                | The domain to use for setting the Spectacle cookies. Leave empty for GTM's automatic domain detection. |

### 4. Tag Execution Consent Settings

| Parameter              | Type  | Default            | Description                                                                                                                             |
| :--------------------- | :---- | :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Ad Storage Consent** | Radio | `Send data always` | **Required** option aborts the tag if `ad_storage` consent is not given (either via Google Consent Mode or Stape's Data Tag parameter). |

### 5. Logs Settings

| Parameter           | Type  | Default                   | Description                                                            |
| :------------------ | :---- | :------------------------ | :--------------------------------------------------------------------- |
| **Log to Console**  | Radio | `Log...debug and preview` | Controls when the full request/response log is sent to the GTM console |
| **Log to BigQuery** | Radio | `Do not log...`           | Allows enabling persistent logging of all tag data to a BigQuery table |

---

## Open Source

The **Spectable by Stape** is developed and maintained by the [Stape Team](https://stape.io/) under the Apache 2.0 license.

### GTM Gallery Status
🟢 [Listed](https://tagmanager.google.com/gallery/#/owners/stape-io/templates/spectacle-tag)
