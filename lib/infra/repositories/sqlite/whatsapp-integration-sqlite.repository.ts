import type { WhatsAppIntegrationConfig } from "@/types/globals";
import type {
  IWhatsAppIntegrationRepository,
  WhatsAppCredentialsInput,
  WhatsAppInstancePersistInput,
} from "@/lib/domain/whatsapp-integration.repository";
import { mergeWhatsAppProviderFieldsJson } from "@/lib/whatsapp-provider-fields";
import { parseNotifyRecipientsJson } from "@/lib/whatsapp-notify-recipients";
import { parseStoredDelaySeconds } from "@/lib/whatsapp-async-delay";
import { getDb } from "@/DB/db";

const ROW_ID = "default";
const DEFAULT_PLATFORM = "uazapi";

function rowToConfig(row: Record<string, unknown>): WhatsAppIntegrationConfig {
  return {
    id: String(row.id),
    platform: String(row.platform ?? DEFAULT_PLATFORM),
    baseUrl: String(row.base_url ?? ""),
    adminToken: String(row.admin_token ?? ""),
    apiToken: String(row.api_token ?? ""),
    selectedInstanceId: row.selected_instance_id != null ? String(row.selected_instance_id) : null,
    instanceToken: String(row.instance_token ?? ""),
    instanceName: row.instance_name != null ? String(row.instance_name) : null,
    instanceStatus: row.instance_status != null ? String(row.instance_status) : null,
    profileName: row.profile_name != null ? String(row.profile_name) : null,
    profilePicUrl: row.profile_pic_url != null ? String(row.profile_pic_url) : null,
    profilePicStorageKey:
      row.profile_pic_storage_key != null ? String(row.profile_pic_storage_key) : null,
    businessProfileJson:
      row.business_profile_json != null ? String(row.business_profile_json) : null,
    instancePayloadJson:
      row.instance_payload_json != null ? String(row.instance_payload_json) : null,
    providerFieldsJson: String(row.provider_fields_json ?? "{}"),
    notifyRecipients: parseNotifyRecipientsJson(row.notify_recipients_json),
    asyncMsgDelayMin: parseStoredDelaySeconds(row.async_msg_delay_min, 3),
    asyncMsgDelayMax: parseStoredDelaySeconds(row.async_msg_delay_max, 5),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export class WhatsAppIntegrationSqliteRepository implements IWhatsAppIntegrationRepository {
  async get(): Promise<WhatsAppIntegrationConfig | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM whatsapp_integration WHERE id = ?")
      .get(ROW_ID) as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async saveCredentials(input: WhatsAppCredentialsInput): Promise<WhatsAppIntegrationConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = await this.get();
    const platform = (input.platform.trim() || DEFAULT_PLATFORM).slice(0, 64);
    const baseUrl = input.baseUrl.trim();
    const mergedAdmin =
      input.adminToken.trim() !== ""
        ? input.adminToken.trim()
        : (existing?.adminToken ?? "").trim();
    const mergedApi =
      input.apiToken.trim() !== ""
        ? input.apiToken.trim()
        : (existing?.apiToken ?? "").trim();

    const mergedPf = mergeWhatsAppProviderFieldsJson(
      existing?.providerFieldsJson,
      platform,
      input.providerFields
    );

    if (existing) {
      db.prepare(
        `UPDATE whatsapp_integration SET platform = ?, base_url = ?, admin_token = ?, api_token = ?, provider_fields_json = ?, updated_at = ? WHERE id = ?`
      ).run(platform, baseUrl, mergedAdmin, mergedApi, mergedPf, now, ROW_ID);
    } else {
      db.prepare(
        `INSERT INTO whatsapp_integration (id, platform, base_url, admin_token, api_token, selected_instance_id, instance_token, instance_name, instance_status, profile_name, profile_pic_url, profile_pic_storage_key, business_profile_json, instance_payload_json, provider_fields_json, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?)`
      ).run(ROW_ID, platform, baseUrl, mergedAdmin, mergedApi, mergedPf, now);
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir integração WhatsApp.");
    return saved;
  }

  async saveInstanceSelection(input: WhatsAppInstancePersistInput): Promise<WhatsAppIntegrationConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Salve a URL e o token de administrador antes de escolher uma instância.");
    }

    db.prepare(
      `UPDATE whatsapp_integration SET
        selected_instance_id = ?,
        instance_token = ?,
        instance_name = ?,
        instance_status = ?,
        profile_name = ?,
        profile_pic_url = ?,
        profile_pic_storage_key = ?,
        business_profile_json = ?,
        instance_payload_json = ?,
        updated_at = ?
      WHERE id = ?`
    ).run(
      input.selectedInstanceId,
      input.instanceToken,
      input.instanceName,
      input.instanceStatus,
      input.profileName,
      input.profilePicUrl,
      input.profilePicStorageKey,
      input.businessProfileJson,
      input.instancePayloadJson,
      now,
      ROW_ID
    );

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar instância WhatsApp.");
    return saved;
  }

  async clearConnectedInstance(): Promise<WhatsAppIntegrationConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Nenhuma configuração WhatsApp encontrada.");
    }

    db.prepare(
      `UPDATE whatsapp_integration SET
        selected_instance_id = NULL,
        instance_token = '',
        instance_name = NULL,
        instance_status = NULL,
        profile_name = NULL,
        profile_pic_url = NULL,
        profile_pic_storage_key = NULL,
        business_profile_json = NULL,
        instance_payload_json = NULL,
        updated_at = ?
      WHERE id = ?`
    ).run(now, ROW_ID);

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao desconectar instância WhatsApp.");
    return saved;
  }

  async saveNotifyRecipients(recipients: string[]): Promise<WhatsAppIntegrationConfig> {
    const db = getDb();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Salve a integração WhatsApp antes de configurar receptores.");
    }
    const json = JSON.stringify(recipients);
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE whatsapp_integration SET notify_recipients_json = ?, updated_at = ? WHERE id = ?`
    ).run(json, now, ROW_ID);
    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar receptores.");
    return saved;
  }

  async saveAsyncDelaySettings(
    msgDelayMin: number,
    msgDelayMax: number
  ): Promise<WhatsAppIntegrationConfig> {
    const db = getDb();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Salve a integração WhatsApp antes de configurar o delay.");
    }
    const min = Math.max(0, Math.trunc(msgDelayMin));
    let max = Math.max(0, Math.trunc(msgDelayMax));
    if (max < min) max = min;
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE whatsapp_integration SET async_msg_delay_min = ?, async_msg_delay_max = ?, updated_at = ? WHERE id = ?`
    ).run(min, max, now, ROW_ID);
    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar delay da fila async.");
    return saved;
  }
}
