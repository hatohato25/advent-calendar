"use client";

/**
 * ユーザーの役割を選択するコンポーネント
 *
 * WHY: UserCreateDialog と UserEditDialog で重複していた役割選択UIを共通化
 * RadioGroupを使用してadmin/editorの選択を提供
 */

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { UserRole } from "@/types/user";

interface RoleSelectorProps {
  /**
   * 現在選択されている役割
   */
  value: UserRole;

  /**
   * 役割が変更されたときに呼び出されるコールバック
   */
  onChange: (value: UserRole) => void;

  /**
   * フォーム要素のID接頭辞
   * WHY: UserCreateDialogとUserEditDialogで異なるIDを使用してアクセシビリティを確保
   */
  idPrefix?: string;
}

export function RoleSelector({ value, onChange, idPrefix = "" }: RoleSelectorProps) {
  const t = useTranslations("admin.users.create");

  return (
    <div className="space-y-2">
      <Label>{t("roleLabel")}</Label>
      <RadioGroup value={value} onValueChange={(value) => onChange(value as UserRole)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="admin" id={`${idPrefix}admin`} />
          <Label htmlFor={`${idPrefix}admin`} className="cursor-pointer">
            {t("roleAdmin")}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="editor" id={`${idPrefix}editor`} />
          <Label htmlFor={`${idPrefix}editor`} className="cursor-pointer">
            {t("roleEditor")}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
