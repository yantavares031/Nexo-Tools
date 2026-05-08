import type { WhatsAppIntegrationConfig } from "@/types/globals";
import type {
  IWhatsAppIntegrationRepository,
  WhatsAppCredentialsInput,
  WhatsAppInstancePersistInput,
} from "@/lib/domain/whatsapp-integration.repository";
import { mergeWhatsAppProviderFieldsJson } from "@/lib/whatsapp-provider-fields";
import { parseNotifyRecipientsJson } from "@/lib/whatsapp-notify-recipients";
import { parseStoredDelaySeconds } from "@/lib/whatsapp-async-delay";
import { getPool } from "@/lib/infra/db-pg";

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

export class WhatsAppIntegrationPostgresRepository implements IWhatsAppIntegrationRepository {
  async get(): Promise<WhatsAppIntegrationConfig | null> {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM whatsapp_integration WHERE id = $1", [ROW_ID]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToConfig(row) : null;
  }

  async saveCredentials(input: WhatsAppCredentialsInput): Promise<WhatsAppIntegrationConfig> {
    const pool = getPool();
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
      await pool.query(
        `UPDATE whatsapp_integration SET platform = $1, base_url = $2, admin_token = $3, api_token = $4, provider_fields_json = $5, updated_at = $6 WHERE id = $7`,
        [platform, baseUrl, mergedAdmin, mergedApi, mergedPf, now, ROW_ID]
      );
    } else {
      await pool.query(
        `INSERT INTO whatsapp_integration (id, platform, base_url, admin_token, api_token, provider_fields_json, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [ROW_ID, platform, baseUrl, mergedAdmin, mergedApi, mergedPf, now]
      );
    }

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao persistir integração WhatsApp.");
    return saved;
  }

  async saveInstanceSelection(input: WhatsAppInstancePersistInput): Promise<WhatsAppIntegrationConfig> {
    const pool = getPool();
    const now = new Date().toISOString();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Salve a URL e o token de administrador antes de escolher uma instância.");
    }

    await pool.query(
      `UPDATE whatsapp_integration SET
        selected_instance_id = $1,
        instance_token = $2,
        instance_name = $3,
        instance_status = $4,
        profile_name = $5,
        profile_pic_url = $6,
        profile_pic_storage_key = $7,
        business_profile_json = $8,
        instance_payload_json = $9,
        updated_at = $10
      WHERE id = $11`,
      [
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
        ROW_ID,
      ]
    );

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar instância WhatsApp.");
    return saved;
  }

  async clearConnectedInstance(): Promise<WhatsAppIntegrationConfig> {
    const pool = getPool();
    const now = new Date().toISOString();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Nenhuma configuração WhatsApp encontrada.");
    }

    await pool.query(
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
        updated_at = $1
      WHERE id = $2`,
      [now, ROW_ID]
    );

    const saved = await this.get();
    if (!saved) throw new Error("Falha ao desconectar instância WhatsApp.");
    return saved;
  }

  async saveNotifyRecipients(recipients: string[]): Promise<WhatsAppIntegrationConfig> {
    const pool = getPool();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Salve a integração WhatsApp antes de configurar receptores.");
    }
    const json = JSON.stringify(recipients);
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE whatsapp_integration SET notify_recipients_json = $1, updated_at = $2 WHERE id = $3`,
      [json, now, ROW_ID]
    );
    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar receptores.");
    return saved;
  }

  async saveAsyncDelaySettings(
    msgDelayMin: number,
    msgDelayMax: number
  ): Promise<WhatsAppIntegrationConfig> {
    const pool = getPool();
    const existing = await this.get();
    if (!existing) {
      throw new Error("Salve a integração WhatsApp antes de configurar o delay.");
    }
    const min = Math.max(0, Math.trunc(msgDelayMin));
    let max = Math.max(0, Math.trunc(msgDelayMax));
    if (max < min) max = min;
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE whatsapp_integration SET async_msg_delay_min = $1, async_msg_delay_max = $2, updated_at = $3 WHERE id = $4`,
      [min, max, now, ROW_ID]
    );
    const saved = await this.get();
    if (!saved) throw new Error("Falha ao salvar delay da fila async.");
    return saved;
  }
}
