import { escapeXml } from "@/lib/sanitize";
import { ICONS } from "@/lib/svg/icons";
import { LanguageStat } from "@/lib/types";
import type { ProfileCardOptions } from "@/lib/profile-card";

export const PROFILE_CARD_STYLES = ["github", "compact", "split", "editorial", "minimal"] as const;
export type ProfileCardStyle = typeof PROFILE_CARD_STYLES[number];
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
type Metric = { value: number; label: string; icon: string };
export type SocialCardContent = { name: string; owner?: string; handle?: string; description: string; avatar: string; metrics: Metric[]; languages: LanguageStat[] };
function text(value: string, x: number, y: number, size: number, color: string, weight = 400) {
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(value)}</text>`;
}
// Use a conservative glyph budget so long names and descriptions cannot touch the avatar.
function lines(value: string, budget: number, maxLines: number): string[] {
  const result: string[] = [];
  let remaining = Array.from(value.replace(/\s+/g, " ").trim());
  while (remaining.length && result.length < maxLines) {
    if (remaining.length <= budget) { result.push(remaining.join("")); break; }
    let cut = remaining.slice(0, budget).lastIndexOf(" ");
    if (cut < budget / 2) cut = budget;
    if (result.length === maxLines - 1) { result.push(remaining.slice(0, budget - 1).join("").trimEnd() + "…"); break; }
    result.push(remaining.slice(0, cut).join("")); remaining = remaining.slice(cut); while (remaining[0] === " ") remaining.shift();
  }
  return result;
}
function picture(uri: string, x: number, y: number, size: number) {
  if (!uri) return "";
  return `<defs><clipPath id="social-avatar"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="12"/></clipPath></defs><image href="${escapeXml(uri)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#social-avatar)"/>`;
}
function metrics(items: Metric[], options: ProfileCardOptions, style: ProfileCardStyle) {
  const {theme,width,height}=options;
  const vertical=style === "split";
  const x=vertical ? width-330 : 64;
  const y=style === "compact" ? height-170 : style === "minimal" ? height-145 : height-180;
  const step=(width-128)/items.length;
  return items.map((item,index)=>{
    const sx=vertical ? x : x+index*step;
    const sy=vertical ? 132+index*75 : y;
    if (style === "minimal") return text(`${item.value.toLocaleString("en-US")} ${item.label.toLowerCase()}`,sx,sy+20,22,theme.muted);
    return `<g transform="translate(${sx} ${sy})"><path d="${ICONS[item.icon] || ICONS.repo}" transform="scale(1.5)" fill="${theme.muted}"/>${text(item.value.toLocaleString("en-US"),36,20,26,theme.text,600)}${text(item.label,vertical?170:0,vertical?20:54,20,theme.muted)}</g>`;
  }).join("");
}
function languagesBar(languages: LanguageStat[], options: ProfileCardOptions) {
  if (!options.showLanguages) return "";
  const {height,width,theme}=options;
  const valid=languages.filter(lang=>Number.isFinite(lang.percentage)&&lang.percentage>0);
  const total=valid.reduce((sum,lang)=>sum+lang.percentage,0);
  if (!total) return text("No language data",64,height-44,18,theme.muted);
  let x=0;
  const bar=valid.map(lang=>{
    const w=width*lang.percentage/total;
    const color=/^#[0-9a-f]{6}$/i.test(lang.color)?lang.color:theme.accent;
    const segment=`<rect x="${x}" y="${height-14}" width="${w}" height="14" fill="${color}"><title>${escapeXml(lang.name)} ${lang.percentage.toFixed(1)}%</title></rect>`; x+=w; return segment;
  }).join("");
  // Names and percentages communicate share without relying on red/green colour differences.
  const labels=valid.slice(0,4).map(lang=>`${lang.name} ${lang.percentage.toFixed(1)}%`).join("   ·   ");
  return `<g data-language-bar="true">${text(lines(labels,85,1)[0]||"",64,height-43,18,theme.muted)}${bar}</g>`;
}
const STYLE_GEOMETRY = {
  github: {size:40,top:115,avatar:144,descriptionLines:2,ownerGap:40},
  compact: {size:28,top:100,avatar:100,descriptionLines:1,ownerGap:40},
  split: {size:40,top:115,avatar:144,descriptionLines:2,ownerGap:40},
  editorial: {size:48,top:115,avatar:144,descriptionLines:2,ownerGap:58},
  minimal: {size:30,top:88,avatar:88,descriptionLines:1,ownerGap:40},
};
function heading(content: SocialCardContent, options: ProfileCardOptions, style: ProfileCardStyle, right: number) {
  const {size,top,descriptionLines,ownerGap}=STYLE_GEOMETRY[style];
  const x=64;
  const budget=Math.max(12,Math.floor((right-x)/(size*.72)));
  const inlineOwner=!!content.owner && ["github","minimal"].includes(style) && (content.owner.length+content.name.length+1)<=budget;
  const title=lines(content.name,inlineOwner ? budget-content.owner!.length-1 : budget,2);
  const owner=content.owner && !inlineOwner ? text(`${content.owner}/`,x,top-ownerGap,24,options.theme.muted) : "";
  const name=inlineOwner ? `<text x="${x}" y="${top}" font-family="${font}" font-size="${size}" fill="${options.theme.text}"><tspan>${escapeXml(content.owner!)}/</tspan><tspan font-weight="600">${escapeXml(content.name)}</tspan></text>` : title.map((line,index)=>text(line,x,top+index*(size+10),size,options.theme.text,content.owner?600:500)).join("");
  const subtitleY=top+title.length*(size+10)+12;
  const handle=content.handle ? text(`@${content.handle}`,x,subtitleY,22,options.theme.muted) : "";
  const description=lines(content.description,Math.floor((right-x)/16),descriptionLines).map((line,index)=>text(line,x,subtitleY+(content.handle?42:0)+index*32,24,options.theme.muted)).join("");
  return owner+name+handle+description;
}
function decoration(content: SocialCardContent, options: ProfileCardOptions, style: ProfileCardStyle) {
  const {width,height,theme}=options;
  const split=style === "split";
  const avatar=options.showAvatar ? picture(content.avatar,split?64:width-208,split?height-230:64,STYLE_GEOMETRY[style].avatar) : "";
  const rule=style === "editorial" ? `<path d="M64 ${height-205}H${width-64}" stroke="${theme.border}"/>` : "";
  return avatar+rule;
}
export function renderSocialLayout(content: SocialCardContent, options: ProfileCardOptions) {
  const {theme,width,height}=options;
  const style=options.type === "compact" && options.style === "github" ? "compact" : options.style || "github";
  const right=style === "split" ? width-400 : options.showAvatar&&content.avatar ? width-280 : width-64;
  const panel=style === "split" ? `<rect x="${width-380}" width="380" height="${height-14}" fill="${theme.panel}"/><path d="M${width-380} 0V${height-14}" stroke="${theme.border}"/>` : "";
  return `<rect width="${width}" height="${height}" fill="${theme.bg}"/><rect x="1" y="1" width="${width-2}" height="${height-2}" fill="none" stroke="${theme.border}"/>${panel}${heading(content,options,style,right)}${decoration(content,options,style)}${metrics(content.metrics,options,style)}${languagesBar(content.languages,options)}`;
}
