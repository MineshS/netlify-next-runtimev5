import { Utils } from '@remkoj/optimizely-dxp-react'
import { gql } from '@gql/gql'
import type * as Types from '@gql/graphql'
import { getServerClient } from '@remkoj/optimizely-dxp-nextjs'
import siteInfo from '@/site-config'

// Header components
import Notice from './notice'
import BrandLogo from './brand-logo'
import Menu from './menu'
import LoginButton from './login-button'
import LanguagePicker from './language-picker'

// Force on server
import 'server-only'
import * as React from 'react'
import getDictionary from './dictionaries'

type SiteHeaderProps = {
    locale?: string
}

export default async function SiteHeader({ locale }: SiteHeaderProps) 
{
    const currentLocale = siteInfo.resolveLocale(locale)
    const client = getServerClient()

    const config = ((await client.request(HeaderConfigQuery, {
        locale: siteInfo.localeToGraphLocale(currentLocale) as Types.Locales,
        siteId: siteInfo.id
    })).HeaderConfigBlock?.items || [])[0]

    const siteName = config?.Name || "Brand name"
    const strings = await getDictionary(currentLocale, siteInfo.defaultLocale)

    // Process & filter the navigation menu, so we're sure that we only get the correct fragment back from it
    const menuItems = (config?.NavMenuArea ?? []).filter(Utils.isNotNullOrUndefined).map(x => x.ContentLink?.Expanded).filter(isNavMenuItem) as Types.NavMenuItemDataFragment[]

    return <header className='shadow-md'>
        <div className='bg-stripe'>
            <div className='max-w-screen-2xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-end content-stretch'>
                <Notice text={ config?.PromoText ?? "" } className='truncate' />
            </div>
        </div>
        <div className='max-w-screen-2xl mx-auto p-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between content-stretch'>
            <BrandLogo brandName={siteName} href={config?.SiteLogo} locale={ locale } className="order-first aspect-[5/1] basis-1/2" />
            <LoginButton texts={ strings.login } />
        </div>
        <div className='bg-primary text-default-onPrimary w-full'>
            <Menu items={ menuItems } brandName={ siteName } locale={ currentLocale } />
        </div>
    </header>
}

type GqlBaseType<T extends string = string> = { __typename?: T }
function isOfType<Type extends string>(typeName: Type, toTest?: GqlBaseType<string>) : toTest is GqlBaseType<Type>
{
    return toTest?.__typename && toTest.__typename == typeName ? true : false
}
function isNavMenuItem(toTest?: GqlBaseType<string> | null) : toTest is GqlBaseType<"NavMenuItem">
{
    return toTest?.__typename && toTest.__typename == "NavMenuItem" ? true : false
}

const HeaderConfigQuery = gql(`query GetHeaderData($siteId: String!, $locale: [Locales]) {
    HeaderConfigBlock(where: { ChannelId: { eq: $siteId } }, locale: $locale) {
        items {
            Name
            SiteLogo
            ChannelId
            CustomCSS
            PromoText
            NavMenuArea {
            DisplayOption
                ContentLink {
                    Expanded {
                        __typename
                        ...NavMenuItemData
                    }
                }
            }
        }
      }
}
  
fragment NavMenuItemData on NavMenuItem {
    Name
    Label
    Links {
        Href
        Text
        Title
        Target
        ContentLink {
            Url
            Language {
                Name
            }
            Expanded {
                RelativePath
            }
        }
    }
    MenuContent {
        item: ContentLink {
            id: Id
            workId: WorkId
            guidValue: GuidValue
            data: Expanded {
                contentType: ContentType
                id: ContentLink {
                    id: Id
                    workId: WorkId
                    guidValue: GuidValue
                }
                locale: Language {
                    name: Name
                }
                path: RelativePath
            }
        }
        displayOption: DisplayOption
    }
    lastLink: NavItemBottomLink {
        href: Href
        title: Title
        target: Target
        text: Text
        item: ContentLink {
            url: Url,
            data: Expanded {
                path: RelativePath
            }
        }
    }
}`)